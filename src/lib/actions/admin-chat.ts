"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { reindexArticle } from "@/lib/ai/reindex";
import { hybridSearch, maxSimilarity } from "@/lib/ai/rag";

const ALLOWED_PARAM_KEYS = new Set([
  "chat.escalation_threshold",
  "chat.topk_vector",
  "chat.topk_final",
  "chat.model",
]);

export async function saveSystemPrompt(
  value: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const trimmed = value.trim();
  if (trimmed.length < 20) {
    return { error: "El system prompt debe tener al menos 20 caracteres." };
  }
  if (trimmed.length > 20000) {
    return { error: "El system prompt supera el máximo de 20.000 caracteres." };
  }

  await prisma.systemSetting.upsert({
    where: { key: "chat.system_prompt" },
    create: {
      key: "chat.system_prompt",
      value: trimmed,
      category: "chat",
      description: "System prompt del asistente MIKE (FASE 5 RAG)",
      updatedBy: session.user.id,
    },
    update: { value: trimmed, updatedBy: session.user.id },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CHAT_SYSTEM_PROMPT_UPDATED",
      entityType: "SystemSetting",
      entityId: "chat.system_prompt",
    },
  });

  revalidatePath("/admin/bot");
  revalidatePath("/dashboard/chat");
  return { ok: true };
}

export async function saveChatParam(
  key: string,
  value: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!ALLOWED_PARAM_KEYS.has(key)) {
    return { error: `Clave no permitida: ${key}` };
  }
  const trimmed = value.trim();
  if (!trimmed) return { error: "Valor vacío." };

  // Validación mínima por clave.
  if (key === "chat.escalation_threshold") {
    const n = parseFloat(trimmed);
    if (!Number.isFinite(n) || n < 0 || n > 1) {
      return { error: "escalation_threshold debe ser un número entre 0 y 1." };
    }
  }
  if (key === "chat.topk_vector" || key === "chat.topk_final") {
    const n = parseInt(trimmed, 10);
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      return { error: `${key} debe ser un entero entre 1 y 100.` };
    }
  }
  if (key === "chat.model" && trimmed.length > 120) {
    return { error: "model demasiado largo." };
  }

  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: trimmed,
      category: "chat",
      updatedBy: session.user.id,
    },
    update: { value: trimmed, updatedBy: session.user.id },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CHAT_PARAM_UPDATED",
      entityType: "SystemSetting",
      entityId: key,
      details: { value: trimmed },
    },
  });

  revalidatePath("/admin/bot");
  revalidatePath("/dashboard/chat");
  return { ok: true };
}

export async function reindexAllKnowledge(): Promise<{
  total?: number;
  reindexed?: number;
  skipped?: number;
  failed?: number;
  error?: string;
}> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const articles = await prisma.knowledgeArticle.findMany({
    select: { id: true },
  });

  let reindexed = 0;
  let skipped = 0;
  let failed = 0;

  for (const a of articles) {
    try {
      const r = await reindexArticle(a.id);
      if (r.skipped) skipped++;
      else reindexed++;
    } catch (err) {
      failed++;
      console.error(`[reindexAll] fail ${a.id}:`, err);
    }
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CHAT_REINDEX_ALL",
      details: { total: articles.length, reindexed, skipped, failed },
    },
  });

  revalidatePath("/admin/bot");
  revalidatePath("/admin/knowledge");
  revalidatePath("/dashboard/chat");

  return { total: articles.length, reindexed, skipped, failed };
}

export interface TestRagResult {
  maxSimilarity: number;
  chunks: {
    id: string;
    articleId: string;
    articleTitle?: string;
    articleSlug?: string;
    similarity?: number;
    rrfScore: number;
    preview: string;
  }[];
  error?: string;
}

export async function testRagQuery(query: string): Promise<TestRagResult> {
  const authz = await checkAdmin();
  if ("error" in authz) {
    return { maxSimilarity: 0, chunks: [], error: authz.error };
  }

  const trimmed = query.trim();
  if (!trimmed) {
    return { maxSimilarity: 0, chunks: [], error: "Query vacía." };
  }

  try {
    const chunks = await hybridSearch(trimmed, 20, 5);
    return {
      maxSimilarity: maxSimilarity(chunks),
      chunks: chunks.map((c) => ({
        id: c.id,
        articleId: c.articleId,
        articleTitle: c.articleTitle,
        articleSlug: c.articleSlug,
        similarity: c.similarity,
        rrfScore: c.rrfScore,
        preview: c.content.slice(0, 280),
      })),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { maxSimilarity: 0, chunks: [], error: msg };
  }
}
