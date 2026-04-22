"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import type { StatusLevel } from "@prisma/client";

function revalidateStatus(userId?: string) {
  revalidatePath("/admin/status");
  if (userId) {
    revalidatePath(`/admin/status/${userId}`);
    revalidatePath(`/admin/users/${userId}`);
  }
  revalidatePath("/dashboard/status");
}

// ============================================
// Per-user scalar updates
// ============================================

export async function setStatusLevel(userId: string, level: StatusLevel) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, statusLevel: true },
  });
  if (!before) return { error: "Usuario no encontrado" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { statusLevel: level },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "STATUS_LEVEL_UPDATED",
        entityType: "user",
        entityId: userId,
        details: { before: before.statusLevel, after: level },
      },
    }),
  ]);

  revalidateStatus(userId);
  return { success: true };
}

export async function setPrestigeScore(userId: string, score: number) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!Number.isInteger(score) || score < 0 || score > 100000) {
    return { error: "Prestigio inválido (0–100000)" };
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, prestigeScore: true },
  });
  if (!before) return { error: "Usuario no encontrado" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { prestigeScore: score },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PRESTIGE_UPDATED",
        entityType: "user",
        entityId: userId,
        details: { before: before.prestigeScore, after: score },
      },
    }),
  ]);

  revalidateStatus(userId);
  return { success: true };
}

export async function setReputationScore(userId: string, score: number) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!Number.isInteger(score) || score < -100000 || score > 100000) {
    return { error: "Reputación inválida" };
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, reputationScore: true },
  });
  if (!before) return { error: "Usuario no encontrado" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { reputationScore: score },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REPUTATION_UPDATED",
        entityType: "user",
        entityId: userId,
        details: { before: before.reputationScore, after: score },
      },
    }),
  ]);

  revalidateStatus(userId);
  return { success: true };
}

// ============================================
// Achievement grant / revoke
// ============================================

export async function grantAchievement(userId: string, achievementId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const [user, achievement, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, pointsAwarded: true, name: true },
    }),
    prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
      select: { id: true },
    }),
  ]);
  if (!user) return { error: "Usuario no encontrado" };
  if (!achievement) return { error: "Logro no encontrado" };
  if (existing) return { error: "El usuario ya tiene este logro" };

  await prisma.$transaction([
    prisma.userAchievement.create({
      data: { userId, achievementId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { prestigeScore: { increment: achievement.pointsAwarded ?? 0 } },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ACHIEVEMENT_GRANTED",
        entityType: "userAchievement",
        entityId: `${userId}:${achievementId}`,
        details: {
          targetUserId: userId,
          achievementId,
          name: achievement.name,
          points: achievement.pointsAwarded,
        },
      },
    }),
  ]);

  revalidateStatus(userId);
  return { success: true };
}

export async function revokeAchievement(userId: string, achievementId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const [user, achievement, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, prestigeScore: true } }),
    prisma.achievement.findUnique({
      where: { id: achievementId },
      select: { id: true, pointsAwarded: true, name: true },
    }),
    prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId } },
      select: { id: true },
    }),
  ]);
  if (!user) return { error: "Usuario no encontrado" };
  if (!achievement) return { error: "Logro no encontrado" };
  if (!existing) return { error: "El usuario no tiene este logro" };

  const currentPrestige = user.prestigeScore ?? 0;
  const decrement = Math.min(currentPrestige, achievement.pointsAwarded ?? 0);

  await prisma.$transaction([
    prisma.userAchievement.delete({
      where: { userId_achievementId: { userId, achievementId } },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { prestigeScore: { decrement } },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ACHIEVEMENT_REVOKED",
        entityType: "userAchievement",
        entityId: `${userId}:${achievementId}`,
        details: {
          targetUserId: userId,
          achievementId,
          name: achievement.name,
          pointsRevoked: decrement,
        },
      },
    }),
  ]);

  revalidateStatus(userId);
  return { success: true };
}

// ============================================
// Achievement catalog CRUD
// ============================================

export type AchievementInput = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointsAwarded: number;
  requiredValue?: number | null;
  isSecret: boolean;
  sortOrder: number;
};

function validateAchievement(input: AchievementInput): string | null {
  if (!input.slug?.trim()) return "Slug requerido";
  if (!/^[a-z0-9_-]{2,48}$/.test(input.slug.trim())) {
    return "Slug inválido (minúsculas, números, - y _, 2–48 chars)";
  }
  if (!input.name?.trim()) return "Nombre requerido";
  if (!input.description?.trim()) return "Descripción requerida";
  if (!input.icon?.trim()) return "Icono requerido";
  if (!input.category?.trim()) return "Categoría requerida";
  if (!Number.isInteger(input.pointsAwarded) || input.pointsAwarded < 0) {
    return "pointsAwarded inválido";
  }
  return null;
}

export async function createAchievement(input: AchievementInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const err = validateAchievement(input);
  if (err) return { error: err };

  const conflict = await prisma.achievement.findUnique({
    where: { slug: input.slug.trim() },
    select: { id: true },
  });
  if (conflict) return { error: "Slug ya existe" };

  const created = await prisma.$transaction(async (tx) => {
    const ach = await tx.achievement.create({
      data: {
        slug: input.slug.trim(),
        name: input.name.trim(),
        description: input.description.trim(),
        icon: input.icon.trim(),
        category: input.category.trim(),
        pointsAwarded: input.pointsAwarded,
        requiredValue: input.requiredValue ?? null,
        isSecret: input.isSecret,
        sortOrder: input.sortOrder,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ACHIEVEMENT_CREATED",
        entityType: "achievement",
        entityId: ach.id,
        details: { slug: ach.slug, name: ach.name, points: ach.pointsAwarded },
      },
    });
    return ach;
  });

  revalidateStatus();
  return { success: true, id: created.id };
}

export async function updateAchievement(id: string, input: AchievementInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const err = validateAchievement(input);
  if (err) return { error: err };

  const before = await prisma.achievement.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!before) return { error: "Logro no encontrado" };

  if (input.slug.trim() !== before.slug) {
    const conflict = await prisma.achievement.findUnique({
      where: { slug: input.slug.trim() },
      select: { id: true },
    });
    if (conflict && conflict.id !== id) return { error: "Slug ya existe" };
  }

  await prisma.$transaction([
    prisma.achievement.update({
      where: { id },
      data: {
        slug: input.slug.trim(),
        name: input.name.trim(),
        description: input.description.trim(),
        icon: input.icon.trim(),
        category: input.category.trim(),
        pointsAwarded: input.pointsAwarded,
        requiredValue: input.requiredValue ?? null,
        isSecret: input.isSecret,
        sortOrder: input.sortOrder,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ACHIEVEMENT_UPDATED",
        entityType: "achievement",
        entityId: id,
        details: { slug: input.slug, name: input.name },
      },
    }),
  ]);

  revalidateStatus();
  return { success: true };
}

export async function deleteAchievement(id: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const achievement = await prisma.achievement.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true },
  });
  if (!achievement) return { error: "Logro no encontrado" };

  await prisma.$transaction(async (tx) => {
    await tx.achievement.delete({ where: { id } });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ACHIEVEMENT_DELETED",
        entityType: "achievement",
        entityId: id,
        details: { slug: achievement.slug, name: achievement.name },
      },
    });
  });

  revalidateStatus();
  return { success: true };
}
