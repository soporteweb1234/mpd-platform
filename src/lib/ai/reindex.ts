import { prisma } from "@/lib/prisma";
import { chunkText } from "./chunking";
import { embedTexts } from "./embeddings";
import { sha256 } from "./hash";

/**
 * Re-indexa un artículo: elimina chunks previos, chunkea title+content,
 * embedd batch, e inserta con cast ::vector (Prisma no serializa vectores).
 *
 * Devuelve { chunks, skipped }. `skipped` es true cuando el contenido no cambió
 * (útil para backfill idempotente).
 */
export async function reindexArticle(articleId: string): Promise<{
  chunks: number;
  skipped: boolean;
}> {
  const article = await prisma.knowledgeArticle.findUnique({
    where: { id: articleId },
    select: { id: true, title: true, content: true },
  });
  if (!article) throw new Error(`KnowledgeArticle ${articleId} no encontrado`);

  const fullText = `${article.title}\n\n${article.content}`;
  const fullHash = sha256(fullText);

  // Skip si todos los chunks existentes vienen del mismo hash (idempotencia).
  const existing = await prisma.knowledgeChunk.findMany({
    where: { articleId },
    select: { contentHash: true },
  });
  if (existing.length > 0 && existing.every((c) => c.contentHash === fullHash)) {
    return { chunks: existing.length, skipped: true };
  }

  const chunks = chunkText(fullText, { size: 1500, overlap: 200 });
  if (chunks.length === 0) {
    await prisma.knowledgeChunk.deleteMany({ where: { articleId } });
    return { chunks: 0, skipped: false };
  }

  const embeddings = await embedTexts(chunks.map((c) => c.content));

  await prisma.$transaction(async (tx) => {
    await tx.knowledgeChunk.deleteMany({ where: { articleId } });
    for (let i = 0; i < chunks.length; i++) {
      const ch = chunks[i];
      const vec = embeddings[i];
      const vectorLiteral = `[${vec.join(",")}]`;
      await tx.$executeRawUnsafe(
        `INSERT INTO "KnowledgeChunk" ("id", "articleId", "chunkIndex", "content", "contentHash", "tokenCount", "embedding", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::vector, CURRENT_TIMESTAMP)`,
        articleId,
        i,
        ch.content,
        fullHash,
        ch.tokenCount,
        vectorLiteral,
      );
    }
  });

  return { chunks: chunks.length, skipped: false };
}

export async function deleteArticleChunks(articleId: string): Promise<void> {
  await prisma.knowledgeChunk.deleteMany({ where: { articleId } });
}
