"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { computeSettlement } from "@/lib/staking/settle";

const createSchema = z
  .object({
    userId: z.string().cuid(),
    totalBankroll: z.number().positive(),
    mpdContribution: z.number().nonnegative(),
    playerContribution: z.number().nonnegative(),
    profitSplitMpd: z.number().min(0).max(100).default(35),
    profitSplitPlayer: z.number().min(0).max(100).default(65),
    startDate: z.string().min(1).optional().or(z.literal("")),
    endDate: z.string().min(1).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (d) => Math.abs(d.mpdContribution + d.playerContribution - d.totalBankroll) < 0.01,
    { message: "aportes suman distinto que totalBankroll", path: ["totalBankroll"] },
  )
  .refine((d) => Math.abs(d.profitSplitMpd + d.profitSplitPlayer - 100) < 0.01, {
    message: "split % debe sumar 100",
    path: ["profitSplitPlayer"],
  });

const updateSchema = createSchema.partial().extend({});

type CreateInput = z.infer<typeof createSchema>;

function zodMsg(result: { success: false; error: z.ZodError }): string {
  return result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

function parseDate(raw: string | undefined | ""): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) throw new Error("fecha inválida");
  return d;
}

function normalize(data: CreateInput) {
  return {
    userId: data.userId,
    totalBankroll: data.totalBankroll,
    mpdContribution: data.mpdContribution,
    playerContribution: data.playerContribution,
    profitSplitMpd: data.profitSplitMpd,
    profitSplitPlayer: data.profitSplitPlayer,
    startDate: parseDate(data.startDate),
    endDate: parseDate(data.endDate),
    notes: data.notes?.trim() || null,
  };
}

function revalidateAll(dealId?: string) {
  revalidatePath("/admin/staking");
  if (dealId) revalidatePath(`/admin/staking/${dealId}`);
  revalidatePath("/dashboard/staking");
  revalidatePath("/dashboard/calendario");
}

export async function createStakingDeal(
  raw: unknown,
): Promise<{ ok?: true; id?: string; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { error: zodMsg(parsed) };

  let data;
  try {
    data = normalize(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Validación" };
  }

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true },
  });
  if (!user) return { error: "Jugador no encontrado" };

  const deal = await prisma.stakingDeal.create({
    data: { ...data, status: "PROPOSED" },
    select: { id: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_CREATED",
      entityType: "StakingDeal",
      entityId: deal.id,
      details: {
        targetUserId: data.userId,
        totalBankroll: data.totalBankroll,
      },
    },
  });

  revalidateAll(deal.id);
  return { ok: true, id: deal.id };
}

export async function updateStakingDeal(
  id: string,
  raw: unknown,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { error: zodMsg(parsed) };

  const existing = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) return { error: "Deal no encontrado" };
  if (existing.status === "SETTLED" || existing.status === "CANCELLED") {
    return { error: "Deal cerrado: no se puede editar" };
  }

  const patch: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.totalBankroll !== undefined) patch.totalBankroll = d.totalBankroll;
  if (d.mpdContribution !== undefined) patch.mpdContribution = d.mpdContribution;
  if (d.playerContribution !== undefined) patch.playerContribution = d.playerContribution;
  if (d.profitSplitMpd !== undefined) patch.profitSplitMpd = d.profitSplitMpd;
  if (d.profitSplitPlayer !== undefined) patch.profitSplitPlayer = d.profitSplitPlayer;
  if (d.startDate !== undefined) patch.startDate = parseDate(d.startDate);
  if (d.endDate !== undefined) patch.endDate = parseDate(d.endDate);
  if (d.notes !== undefined) patch.notes = d.notes?.trim() || null;

  await prisma.stakingDeal.update({ where: { id }, data: patch });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_UPDATED",
      entityType: "StakingDeal",
      entityId: id,
      details: JSON.parse(JSON.stringify(patch)),
    },
  });

  revalidateAll(id);
  return { ok: true };
}

export async function activateStakingDeal(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, status: true, startDate: true },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.status !== "PROPOSED") {
    return { error: `Estado actual ${deal.status} no permite activar` };
  }

  await prisma.stakingDeal.update({
    where: { id },
    data: { status: "ACTIVE", startDate: deal.startDate ?? new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_ACTIVATED",
      entityType: "StakingDeal",
      entityId: id,
      details: {},
    },
  });

  revalidateAll(id);
  return { ok: true };
}

const periodSchema = z
  .object({
    dealId: z.string().cuid(),
    periodStart: z.string().min(1),
    periodEnd: z.string().min(1),
    profitLoss: z.number(),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((d) => new Date(d.periodEnd).getTime() >= new Date(d.periodStart).getTime(), {
    message: "periodEnd debe ser >= periodStart",
    path: ["periodEnd"],
  });

export async function addStakingPeriod(
  raw: unknown,
): Promise<{ ok?: true; periodId?: string; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = periodSchema.safeParse(raw);
  if (!parsed.success) return { error: zodMsg(parsed) };

  const d = parsed.data;
  const deal = await prisma.stakingDeal.findUnique({
    where: { id: d.dealId },
    select: {
      id: true,
      status: true,
      currentMakeup: true,
      totalProfit: true,
      totalLoss: true,
      profitSplitMpd: true,
      profitSplitPlayer: true,
    },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.status !== "ACTIVE") {
    return { error: `Solo se pueden añadir periodos a deals ACTIVE (actual ${deal.status})` };
  }

  const settlement = computeSettlement({
    profitLoss: d.profitLoss,
    makeupBefore: deal.currentMakeup,
    profitSplitMpd: deal.profitSplitMpd,
    profitSplitPlayer: deal.profitSplitPlayer,
  });

  const [period] = await prisma.$transaction([
    prisma.stakingPeriod.create({
      data: {
        dealId: d.dealId,
        periodStart: new Date(d.periodStart),
        periodEnd: new Date(d.periodEnd),
        profitLoss: d.profitLoss,
        makeupBefore: deal.currentMakeup,
        makeupAfter: settlement.makeupAfter,
        mpdShare: settlement.mpdShare,
        playerShare: settlement.playerShare,
        notes: d.notes?.trim() || null,
      },
      select: { id: true },
    }),
    prisma.stakingDeal.update({
      where: { id: d.dealId },
      data: {
        currentMakeup: settlement.makeupAfter,
        totalProfit: { increment: d.profitLoss > 0 ? d.profitLoss : 0 },
        totalLoss: { increment: d.profitLoss < 0 ? Math.abs(d.profitLoss) : 0 },
      },
    }),
  ]);

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_PERIOD_ADDED",
      entityType: "StakingPeriod",
      entityId: period.id,
      details: {
        dealId: d.dealId,
        profitLoss: d.profitLoss,
        makeupAfter: settlement.makeupAfter,
        mpdShare: settlement.mpdShare,
        playerShare: settlement.playerShare,
      },
    },
  });

  revalidateAll(d.dealId);
  return { ok: true, periodId: period.id };
}

export async function settleStakingDeal(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.status !== "ACTIVE") {
    return { error: `Solo se liquidan deals ACTIVE (actual ${deal.status})` };
  }

  await prisma.stakingDeal.update({
    where: { id },
    data: { status: "SETTLED", endDate: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_SETTLED",
      entityType: "StakingDeal",
      entityId: id,
      details: {},
    },
  });

  revalidateAll(id);
  return { ok: true };
}

export async function cancelStakingDeal(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.status === "SETTLED" || deal.status === "DEFAULTED") {
    return { error: `No se puede cancelar un deal ${deal.status}` };
  }

  await prisma.stakingDeal.update({
    where: { id },
    data: { status: "CANCELLED", endDate: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_CANCELLED",
      entityType: "StakingDeal",
      entityId: id,
      details: {},
    },
  });

  revalidateAll(id);
  return { ok: true };
}

export async function defaultStakingDeal(
  id: string,
  reason?: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.status !== "ACTIVE") {
    return { error: `Solo se marca default un deal ACTIVE (actual ${deal.status})` };
  }

  await prisma.stakingDeal.update({
    where: { id },
    data: { status: "DEFAULTED", endDate: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_DEFAULTED",
      entityType: "StakingDeal",
      entityId: id,
      details: { reason: reason ?? null },
    },
  });

  revalidateAll(id);
  return { ok: true };
}
