-- FASE 5 — Chat MIKE con RAG
-- KnowledgeChunk (pgvector + FTS) + ChatQueryLog + SystemSetting seeds
-- Patrón 4.A.7 idempotente (IF NOT EXISTS, DO $$ ... EXCEPTION WHEN duplicate_object)

-- ============================================
-- pgvector extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- KnowledgeChunk
-- ============================================
CREATE TABLE IF NOT EXISTS "KnowledgeChunk" (
  "id"          TEXT NOT NULL,
  "articleId"   TEXT NOT NULL,
  "chunkIndex"  INTEGER NOT NULL,
  "content"     TEXT NOT NULL,
  "contentHash" TEXT NOT NULL,
  "tokenCount"  INTEGER NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- pgvector column (Prisma Unsupported — declared out-of-band)
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);

CREATE UNIQUE INDEX IF NOT EXISTS "KnowledgeChunk_articleId_chunkIndex_key"
  ON "KnowledgeChunk" ("articleId", "chunkIndex");

CREATE INDEX IF NOT EXISTS "KnowledgeChunk_articleId_idx"
  ON "KnowledgeChunk" ("articleId");

-- HNSW vector index (cosine) — production-safety rule: never IVFFlat
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_hnsw"
  ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN full-text index (Spanish)
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_content_fts"
  ON "KnowledgeChunk" USING gin (to_tsvector('spanish', "content"));

-- FK article → chunks (cascade delete)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'KnowledgeChunk_articleId_fkey') THEN
    ALTER TABLE "KnowledgeChunk"
      ADD CONSTRAINT "KnowledgeChunk_articleId_fkey"
      FOREIGN KEY ("articleId") REFERENCES "KnowledgeArticle"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- ChatQueryLog
-- ============================================
CREATE TABLE IF NOT EXISTS "ChatQueryLog" (
  "id"                   TEXT NOT NULL,
  "userId"               TEXT NOT NULL,
  "query"                TEXT NOT NULL,
  "answer"               TEXT,
  "maxSimilarity"        DOUBLE PRECISION,
  "chunkIds"             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "latencyMs"            INTEGER,
  "tokensIn"             INTEGER,
  "tokensOut"            INTEGER,
  "escalatedToTicketId"  TEXT,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatQueryLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ChatQueryLog_userId_createdAt_idx"
  ON "ChatQueryLog" ("userId", "createdAt" DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChatQueryLog_userId_fkey') THEN
    ALTER TABLE "ChatQueryLog"
      ADD CONSTRAINT "ChatQueryLog_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ============================================
-- SystemSetting seeds (chat.*)
-- ============================================
INSERT INTO "SystemSetting" ("id", "key", "value", "description", "category", "updatedAt")
VALUES
  (
    'seed_chat_system_prompt',
    'chat.system_prompt',
    'Eres MIKE, el asistente 24h de Manager Poker Deals (MPD). Personalidad: educado, correcto, formal, asertivo, orientado a soluciones y empático con el estrés del usuario. Experto en poker online, rakeback y gestión de bankroll.

REGLAS:
- Responde SIEMPRE en español.
- Usa la información proporcionada en el bloque <context>...</context> como fuente principal. Si el contexto no cubre la pregunta, dilo explícitamente y sugiere abrir ticket.
- No inventes porcentajes de salas específicas ni prometas rendimientos.
- Máximo 3–4 párrafos; usa **negrita** para términos clave y listas con guion.
- Si la pregunta requiere datos personales del jugador (saldo exacto, historial), indica que puede consultarlos en su dashboard.',
    'System prompt del chat MIKE (RAG). Editable desde /admin/bot.',
    'chat',
    CURRENT_TIMESTAMP
  ),
  (
    'seed_chat_escalation_threshold',
    'chat.escalation_threshold',
    '0.65',
    'Similaridad mínima para considerar que la KB cubre la pregunta. Por debajo → sugerir ticket.',
    'chat',
    CURRENT_TIMESTAMP
  ),
  (
    'seed_chat_topk_vector',
    'chat.topk_vector',
    '20',
    'Top-K de candidatos del retrieval vectorial antes de fusión RRF.',
    'chat',
    CURRENT_TIMESTAMP
  ),
  (
    'seed_chat_topk_final',
    'chat.topk_final',
    '5',
    'Número de chunks finales tras RRF que se inyectan en el contexto del LLM.',
    'chat',
    CURRENT_TIMESTAMP
  ),
  (
    'seed_chat_model',
    'chat.model',
    'claude-haiku-4-5-20251001',
    'Modelo Anthropic usado para generar respuestas del chat.',
    'chat',
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("key") DO NOTHING;
