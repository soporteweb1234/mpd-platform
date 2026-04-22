"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";

export type SuggestedQuestionInput = {
  question: string;
  category?: string | null;
  priority?: number;
  active?: boolean;
};

function normalize(data: SuggestedQuestionInput) {
  return {
    question: data.question.trim(),
    category: data.category?.trim() || null,
    priority: Number.isFinite(data.priority) ? Number(data.priority) : 0,
    active: data.active ?? true,
  };
}

function revalidateBot() {
  revalidatePath("/admin/bot");
  revalidatePath("/dashboard/chat");
}

export async function createSuggestedQuestion(data: SuggestedQuestionInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const n = normalize(data);
  if (!n.question || n.question.length < 5) {
    return { error: "La pregunta debe tener al menos 5 caracteres" };
  }

  const created = await prisma.$transaction(async (tx) => {
    const q = await tx.suggestedQuestion.create({
      data: { ...n, createdBy: session.user.id },
    });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SUGGESTED_QUESTION_CREATED",
        entityType: "suggestedQuestion",
        entityId: q.id,
        details: { question: q.question, category: q.category },
      },
    });
    return q;
  });

  revalidateBot();
  return { success: true, id: created.id };
}

export async function updateSuggestedQuestion(
  id: string,
  data: SuggestedQuestionInput,
) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const n = normalize(data);
  if (!n.question || n.question.length < 5) {
    return { error: "La pregunta debe tener al menos 5 caracteres" };
  }

  const existing = await prisma.suggestedQuestion.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Pregunta no encontrada" };

  await prisma.$transaction([
    prisma.suggestedQuestion.update({ where: { id }, data: n }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SUGGESTED_QUESTION_UPDATED",
        entityType: "suggestedQuestion",
        entityId: id,
        details: { ...n },
      },
    }),
  ]);

  revalidateBot();
  return { success: true };
}

export async function toggleSuggestedQuestion(id: string, active: boolean) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const existing = await prisma.suggestedQuestion.findUnique({
    where: { id },
    select: { id: true, active: true },
  });
  if (!existing) return { error: "Pregunta no encontrada" };

  await prisma.$transaction([
    prisma.suggestedQuestion.update({ where: { id }, data: { active } }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SUGGESTED_QUESTION_TOGGLED",
        entityType: "suggestedQuestion",
        entityId: id,
        details: { active, previous: existing.active },
      },
    }),
  ]);

  revalidateBot();
  return { success: true };
}

export async function deleteSuggestedQuestion(id: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const existing = await prisma.suggestedQuestion.findUnique({
    where: { id },
    select: { id: true, question: true },
  });
  if (!existing) return { error: "Pregunta no encontrada" };

  await prisma.$transaction([
    prisma.suggestedQuestion.delete({ where: { id } }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SUGGESTED_QUESTION_DELETED",
        entityType: "suggestedQuestion",
        entityId: id,
        details: { question: existing.question },
      },
    }),
  ]);

  revalidateBot();
  return { success: true };
}
