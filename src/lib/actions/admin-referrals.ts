"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";

function revalidateReferrals(userId?: string) {
  revalidatePath("/admin/referrals");
  if (userId) revalidatePath(`/admin/referrals/${userId}`);
  revalidatePath("/dashboard/referrals");
}

// ============================================
// referralCode (User.referralCode)
// ============================================

export async function setReferralCode(userId: string, code: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const trimmed = code.trim();
  if (!/^[a-zA-Z0-9_-]{4,32}$/.test(trimmed)) {
    return { error: "Código inválido (4–32 caracteres: letras, números, -, _)" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, referralCode: true },
  });
  if (!target) return { error: "Usuario no encontrado" };

  const conflict = await prisma.user.findUnique({
    where: { referralCode: trimmed },
    select: { id: true },
  });
  if (conflict && conflict.id !== userId) {
    return { error: "Ese código ya está en uso" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { referralCode: trimmed },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REFERRAL_CODE_UPDATED",
        entityType: "user",
        entityId: userId,
        details: { before: target.referralCode, after: trimmed },
      },
    }),
  ]);

  revalidateReferrals(userId);
  return { success: true };
}

// ============================================
// Link / unlink referrer (repair manual)
// ============================================

export async function linkReferral(referredUserId: string, referrerUserId: string | null) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!referredUserId) return { error: "Usuario requerido" };
  if (referredUserId === referrerUserId) {
    return { error: "Un usuario no puede referirse a sí mismo" };
  }

  const target = await prisma.user.findUnique({
    where: { id: referredUserId },
    select: { id: true, referredById: true },
  });
  if (!target) return { error: "Usuario no encontrado" };

  if (referrerUserId) {
    const ref = await prisma.user.findUnique({
      where: { id: referrerUserId },
      select: { id: true },
    });
    if (!ref) return { error: "Referrer no encontrado" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: referredUserId },
      data: { referredById: referrerUserId },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REFERRAL_LINK_UPDATED",
        entityType: "user",
        entityId: referredUserId,
        details: { before: target.referredById, after: referrerUserId },
      },
    }),
  ]);

  revalidateReferrals(referrerUserId ?? undefined);
  revalidateReferrals(referredUserId);
  return { success: true };
}

// ============================================
// ReferralCommission overrides
// ============================================

export type ReferralCommissionInput = {
  referrerId: string;
  referredId: string;
  roomId: string;
  commissionPercent: number;
  periodStart: string;
  periodEnd?: string | null;
  active: boolean;
  notes?: string | null;
};

function parseDate(d?: string | null): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateCommission(input: ReferralCommissionInput): string | null {
  if (!input.referrerId || !input.referredId || !input.roomId) {
    return "Referrer, referido y sala son obligatorios";
  }
  if (input.referrerId === input.referredId) {
    return "Referrer y referido no pueden ser el mismo usuario";
  }
  if (
    !Number.isFinite(input.commissionPercent) ||
    input.commissionPercent < 0 ||
    input.commissionPercent > 100
  ) {
    return "commissionPercent fuera de rango (0–100)";
  }
  const start = parseDate(input.periodStart);
  if (!start) return "periodStart inválido";
  if (input.periodEnd) {
    const end = parseDate(input.periodEnd);
    if (!end) return "periodEnd inválido";
    if (end < start) return "periodEnd anterior a periodStart";
  }
  return null;
}

export async function upsertReferralCommission(input: ReferralCommissionInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const err = validateCommission(input);
  if (err) return { error: err };

  const start = parseDate(input.periodStart)!;
  const end = parseDate(input.periodEnd ?? null);

  const existing = await prisma.referralCommission.findUnique({
    where: {
      referrerId_referredId_roomId_periodStart: {
        referrerId: input.referrerId,
        referredId: input.referredId,
        roomId: input.roomId,
        periodStart: start,
      },
    },
    select: { id: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (existing) {
      const updated = await tx.referralCommission.update({
        where: { id: existing.id },
        data: {
          commissionPercent: input.commissionPercent,
          periodEnd: end,
          active: input.active,
          notes: input.notes?.trim() || null,
        },
      });
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "REFERRAL_COMMISSION_UPDATED",
          entityType: "referralCommission",
          entityId: updated.id,
          details: {
            referrerId: input.referrerId,
            referredId: input.referredId,
            roomId: input.roomId,
            commissionPercent: input.commissionPercent,
            active: input.active,
          },
        },
      });
      return updated;
    }
    const created = await tx.referralCommission.create({
      data: {
        referrerId: input.referrerId,
        referredId: input.referredId,
        roomId: input.roomId,
        commissionPercent: input.commissionPercent,
        periodStart: start,
        periodEnd: end,
        active: input.active,
        notes: input.notes?.trim() || null,
        createdBy: session.user.id,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REFERRAL_COMMISSION_CREATED",
        entityType: "referralCommission",
        entityId: created.id,
        details: {
          referrerId: input.referrerId,
          referredId: input.referredId,
          roomId: input.roomId,
          commissionPercent: input.commissionPercent,
        },
      },
    });
    return created;
  });

  revalidateReferrals(input.referrerId);
  revalidateReferrals(input.referredId);
  return { success: true, id: result.id };
}

export async function toggleReferralCommission(id: string, active: boolean) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const before = await prisma.referralCommission.findUnique({
    where: { id },
    select: { id: true, referrerId: true, referredId: true, active: true },
  });
  if (!before) return { error: "Comisión no encontrada" };

  await prisma.$transaction([
    prisma.referralCommission.update({
      where: { id },
      data: { active },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REFERRAL_COMMISSION_TOGGLED",
        entityType: "referralCommission",
        entityId: id,
        details: { before: before.active, after: active },
      },
    }),
  ]);

  revalidateReferrals(before.referrerId);
  revalidateReferrals(before.referredId);
  return { success: true };
}

export async function deleteReferralCommission(id: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const before = await prisma.referralCommission.findUnique({
    where: { id },
    select: { id: true, referrerId: true, referredId: true, roomId: true },
  });
  if (!before) return { error: "Comisión no encontrada" };

  await prisma.$transaction(async (tx) => {
    await tx.referralCommission.delete({ where: { id } });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "REFERRAL_COMMISSION_DELETED",
        entityType: "referralCommission",
        entityId: id,
        details: {
          referrerId: before.referrerId,
          referredId: before.referredId,
          roomId: before.roomId,
        },
      },
    });
  });

  revalidateReferrals(before.referrerId);
  revalidateReferrals(before.referredId);
  return { success: true };
}
