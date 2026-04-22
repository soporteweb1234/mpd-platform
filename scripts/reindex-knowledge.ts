/**
 * Backfill: re-embedea todos los KnowledgeArticle existentes.
 * Uso: npx tsx scripts/reindex-knowledge.ts
 *
 * Idempotente: reindexArticle() compara sha256(title+content) contra los chunks
 * existentes; si coinciden todos, skip embedding (no llama OpenAI).
 */
import { prisma } from "../src/lib/prisma";
import { reindexArticle } from "../src/lib/ai/reindex";

async function main() {
  const started = Date.now();
  const articles = await prisma.knowledgeArticle.findMany({
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`[reindex] ${articles.length} artículo(s) encontrados.`);

  let total = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const art = articles[i];
    const prefix = `[${i + 1}/${articles.length}]`;
    try {
      const result = await reindexArticle(art.id);
      if (result.skipped) {
        skipped++;
        console.log(`${prefix} skip  (${result.chunks} chunks) — ${art.title}`);
      } else {
        total += result.chunks;
        console.log(`${prefix} ok    (${result.chunks} chunks) — ${art.title}`);
      }
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${prefix} FAIL  — ${art.title}: ${msg}`);
    }
  }

  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `\n[reindex] done en ${elapsed}s. chunks nuevos=${total} skipped=${skipped} failed=${failed}`,
  );

  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error("[reindex] fatal:", err);
  await prisma.$disconnect();
  process.exit(1);
});
