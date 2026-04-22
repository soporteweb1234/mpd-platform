"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import type { PlayerStratum } from "@prisma/client";

type Audience =
  | { kind: "ALL" }
  | { kind: "STRATUM"; stratum: PlayerStratum }
  | { kind: "USER"; userId: string };

export async function sendKnowledgeAsNotification(data: {
  articleId: string;
  audience: Audience;
  customTitle?: string;
  customMessage?: string;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const article = await prisma.knowledgeArticle.findUnique({
    where: { id: data.articleId },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
      isPublic: true,
    },
  });
  if (!article) return { error: "Artículo no encontrado" };

  const title = (data.customTitle?.trim() || article.title).slice(0, 160);
  const message = (
    data.customMessage?.trim() || article.content.slice(0, 200)
  ).slice(0, 500);
  const link = `/dashboard/knowledge/${article.slug}`;

  let userIds: string[] = [];
  if (data.audience.kind === "ALL") {
    const users = await prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else if (data.audience.kind === "STRATUM") {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        status: "ACTIVE",
        stratum: data.audience.stratum,
      },
      select: { id: true },
    });
    userIds = users.map((u) => u.id);
  } else if (data.audience.kind === "USER") {
    const user = await prisma.user.findUnique({
      where: { id: data.audience.userId },
      select: { id: true, deletedAt: true, status: true },
    });
    if (!user || user.deletedAt || user.status !== "ACTIVE") {
      return { error: "Usuario no válido para notificar" };
    }
    userIds = [user.id];
  }

  if (userIds.length === 0) {
    return { error: "La audiencia seleccionada no tiene destinatarios" };
  }

  await prisma.$transaction([
    prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: "KNOWLEDGE_SHARED",
        title,
        message,
        link,
      })),
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "KNOWLEDGE_SENT",
        entityType: "knowledgeArticle",
        entityId: article.id,
        details: {
          audience: data.audience,
          recipients: userIds.length,
          title,
          slug: article.slug,
        },
      },
    }),
  ]);

  revalidatePath("/admin/notifications");
  revalidatePath("/admin/knowledge");
  return { success: true, count: userIds.length };
}
