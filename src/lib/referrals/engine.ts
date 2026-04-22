import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { creditBalance } from "@/lib/wallet";

export type PlannedAttribution = {
  referrerId: string;
  referredId: string;
  level: 1 | 2;
  sourceAmount: number;
  commissionPct: number;
  amount: number;
};

export type ComputeInput = {
  referredUserId: string;
  rakebackAmount: number;
  roomId: string | null;
  rakebackRecordId: string | null;
};

type Tx = Prisma.TransactionClient;

function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export async function getReferralPolicy() {
  let policy = await prisma.referralPolicy.findUnique({ where: { id: "global" } });
  if (!policy) {
    policy = await prisma.referralPolicy.create({ data: { id: "global" } });
  }
  return policy;
}

async function resolveOverridePct(
  referrerId: string,
  referredId: string,
  roomId: string | null,
  now: Date,
): Promise<number | null> {
  if (!roomId) return null;
  const override = await prisma.referralCommission.findFirst({
    where: {
      referrerId,
      referredId,
      roomId,
      active: true,
      periodStart: { lte: now },
      OR: [{ periodEnd: null }, { periodEnd: { gte: now } }],
    },
    orderBy: { periodStart: "desc" },
    select: { commissionPercent: true },
  });
  return override ? override.commissionPercent.toNumber() : null;
}

export async function computeReferralCommissions(
  input: ComputeInput,
): Promise<PlannedAttribution[]> {
  if (input.rakebackAmount <= 0) return [];

  const referred = await prisma.user.findUnique({
    where: { id: input.referredUserId },
    select: {
      id: true,
      referredById: true,
      referredBy: {
        select: {
          id: true,
          referredById: true,
        },
      },
    },
  });
  if (!referred?.referredBy) return [];

  const policy = await getReferralPolicy();
  const now = new Date();

  const planned: PlannedAttribution[] = [];

  // L1
  const l1 = referred.referredBy;
  const l1Override = await resolveOverridePct(l1.id, referred.id, input.roomId, now);
  const l1PctRaw = l1Override ?? policy.defaultL1Percent.toNumber();
  const l1Pct = Math.min(l1PctRaw, policy.maxL1Percent.toNumber());
  const l1Amount = round2((input.rakebackAmount * l1Pct) / 100);
  if (l1Amount > 0) {
    planned.push({
      referrerId: l1.id,
      referredId: referred.id,
      level: 1,
      sourceAmount: round2(input.rakebackAmount),
      commissionPct: l1Pct,
      amount: l1Amount,
    });
  }

  // L2
  if (l1.referredById) {
    const l2Pct = Math.min(
      policy.defaultL2Percent.toNumber(),
      policy.maxL2Percent.toNumber(),
    );
    const l2Amount = round2((input.rakebackAmount * l2Pct) / 100);
    if (l2Amount > 0) {
      planned.push({
        referrerId: l1.referredById,
        referredId: referred.id,
        level: 2,
        sourceAmount: round2(input.rakebackAmount),
        commissionPct: l2Pct,
        amount: l2Amount,
      });
    }
  }

  return planned;
}

export async function creditReferralCommissions(
  tx: Tx,
  planned: PlannedAttribution[],
  holdDays: number,
  rakebackRecordId: string | null,
): Promise<void> {
  if (planned.length === 0) return;
  const maturedAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000);

  for (const p of planned) {
    try {
      await tx.referralAttribution.create({
        data: {
          referrerId: p.referrerId,
          referredId: p.referredId,
          level: p.level,
          rakebackRecordId,
          sourceAmount: p.sourceAmount,
          commissionPct: p.commissionPct,
          amount: p.amount,
          status: "PENDING",
          maturedAt,
        },
      });
      await tx.user.update({
        where: { id: p.referrerId },
        data: { pendingBalance: { increment: p.amount } },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue; // idempotencia: mismo (referrer, rakebackRecord, level)
      }
      throw err;
    }
  }
}

export async function maturePendingReferrals(
  limit = 200,
): Promise<{ matured: number; failed: number }> {
  const due = await prisma.referralAttribution.findMany({
    where: {
      status: "PENDING",
      maturedAt: { lte: new Date() },
    },
    take: limit,
    select: { id: true, referrerId: true, amount: true },
    orderBy: { createdAt: "asc" },
  });

  let matured = 0;
  let failed = 0;
  for (const att of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const upd = await tx.referralAttribution.updateMany({
          where: { id: att.id, status: "PENDING" },
          data: { status: "AVAILABLE", paidAt: new Date() },
        });
        if (upd.count !== 1) return;

        // Move from pending to available via creditBalance (increments available
        // + writes BalanceTransaction). We decrement pendingBalance separately.
        await creditBalance(
          tx,
          att.referrerId,
          att.amount.toNumber(),
          "REFERRAL_COMMISSION",
          "Comisión referido (vencida)",
          null,
          "ReferralAttribution",
        );
        await tx.user.update({
          where: { id: att.referrerId },
          data: { pendingBalance: { decrement: att.amount } },
        });
      });
      matured++;
    } catch {
      failed++;
    }
  }
  return { matured, failed };
}
