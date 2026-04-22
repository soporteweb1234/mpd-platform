import { prisma } from "@/lib/prisma";
import { embedTexts } from "./embeddings";

export interface RetrievedChunk {
  id: string;
  articleId: string;
  content: string;
  /** Distancia coseno (0 = idéntico, 2 = opuesto). Solo presente si vino del vector search. */
  distance?: number;
  /** ts_rank del FTS. Solo presente si vino del FTS. */
  ftsRank?: number;
  /** Score RRF fusionado. */
  rrfScore: number;
  /** Similitud coseno = 1 - distance. undefined si sólo FTS. */
  similarity?: number;
  articleTitle?: string;
  articleSlug?: string;
}

interface VectorRow {
  id: string;
  articleId: string;
  content: string;
  distance: number;
}

interface FtsRow {
  id: string;
  articleId: string;
  content: string;
  rank: number;
}

/**
 * Hybrid retrieval: cosine <=> sobre embedding + to_tsvector('spanish') FTS,
 * fusionados con Reciprocal Rank Fusion (k=60, estándar académico).
 *
 * @param query  Texto de la query del usuario.
 * @param topKVector  Número de candidatos que pedimos a cada canal (default 20).
 * @param finalK  Número de chunks fusionados que devolvemos (default 5).
 */
export async function hybridSearch(
  query: string,
  topKVector = 20,
  finalK = 5,
): Promise<RetrievedChunk[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [queryEmbedding] = await embedTexts([trimmed]);
  if (!queryEmbedding) return [];
  const embeddingLiteral = `[${queryEmbedding.join(",")}]`;

  // Canal 1 — vector cosine (HNSW index).
  const vectorRows = await prisma.$queryRawUnsafe<VectorRow[]>(
    `SELECT "id", "articleId", "content",
            ("embedding" <=> $1::vector) AS distance
       FROM "KnowledgeChunk"
      WHERE "embedding" IS NOT NULL
      ORDER BY "embedding" <=> $1::vector
      LIMIT $2`,
    embeddingLiteral,
    topKVector,
  );

  // Canal 2 — FTS en español (GIN index).
  const ftsRows = await prisma.$queryRawUnsafe<FtsRow[]>(
    `SELECT "id", "articleId", "content",
            ts_rank(to_tsvector('spanish', "content"), plainto_tsquery('spanish', $1)) AS rank
       FROM "KnowledgeChunk"
      WHERE to_tsvector('spanish', "content") @@ plainto_tsquery('spanish', $1)
      ORDER BY rank DESC
      LIMIT $2`,
    trimmed,
    topKVector,
  );

  const fused = rrfFuse(vectorRows, ftsRows, { k: 60, finalK });
  if (fused.length === 0) return [];

  // Enriquecer con metadata del article (título/slug) sin un N+1 — batch.
  const articleIds = Array.from(new Set(fused.map((c) => c.articleId)));
  const articles = await prisma.knowledgeArticle.findMany({
    where: { id: { in: articleIds } },
    select: { id: true, title: true, slug: true },
  });
  const byId = new Map(articles.map((a) => [a.id, a]));

  return fused.map((c) => ({
    ...c,
    articleTitle: byId.get(c.articleId)?.title,
    articleSlug: byId.get(c.articleId)?.slug,
  }));
}

/**
 * Reciprocal Rank Fusion: score(chunk) = Σ 1 / (k + rank_i)
 * donde rank_i es la posición 1-indexada del chunk en cada canal.
 * Chunks no presentes en un canal no contribuyen (no penalización).
 */
function rrfFuse(
  vectorRows: VectorRow[],
  ftsRows: FtsRow[],
  opts: { k: number; finalK: number },
): RetrievedChunk[] {
  const { k, finalK } = opts;
  const acc = new Map<string, RetrievedChunk>();

  vectorRows.forEach((row, idx) => {
    const rank = idx + 1;
    const contribution = 1 / (k + rank);
    const distance = Number(row.distance);
    acc.set(row.id, {
      id: row.id,
      articleId: row.articleId,
      content: row.content,
      distance,
      similarity: 1 - distance,
      rrfScore: contribution,
    });
  });

  ftsRows.forEach((row, idx) => {
    const rank = idx + 1;
    const contribution = 1 / (k + rank);
    const existing = acc.get(row.id);
    if (existing) {
      existing.rrfScore += contribution;
      existing.ftsRank = Number(row.rank);
    } else {
      acc.set(row.id, {
        id: row.id,
        articleId: row.articleId,
        content: row.content,
        ftsRank: Number(row.rank),
        rrfScore: contribution,
      });
    }
  });

  return Array.from(acc.values())
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, finalK);
}

/**
 * Debug helper: devuelve la similitud máxima encontrada entre los chunks
 * fusionados. Útil para logging + decisión de escalation.
 */
export function maxSimilarity(chunks: RetrievedChunk[]): number {
  let max = 0;
  for (const c of chunks) {
    if (c.similarity !== undefined && c.similarity > max) max = c.similarity;
  }
  return max;
}
