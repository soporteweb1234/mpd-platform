"use server";

import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { rateLimit, RateLimits } from "@/lib/security/ratelimit";
import { toNum, addMoney, isNegative } from "@/lib/money";

export async function loadRakeback(data: {
  userId: string;
  roomId: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  rakeGenerated: number;
  rakebackPercent: number;
  notes?: string;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const rl = await rateLimit(RateLimits.adminMoney, session.user.id);
  if (!rl.success) return { error: "Rate limit: espera unos segundos" };

  const rakebackAmount = (data.rakeGenerated * data.rakebackPercent) / 100;

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { availableBalance: true, totalRakeback: true },
  });

  if (!user) return { error: "Usuario no encontrado" };

  await prisma.$transaction([
    prisma.rakebackRecord.create({
      data: {
        userId: data.userId,
        roomId: data.roomId,
        period: data.period,
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        rakeGenerated: data.rakeGenerated,
        rakebackPercent: data.rakebackPercent,
        rakebackAmount,
        status: "AVAILABLE",
        loadedBy: session.user.id,
        loadedAt: new Date(),
        notes: data.notes,
      },
    }),
    prisma.balanceTransaction.create({
      data: {
        userId: data.userId,
        type: "RAKEBACK_CREDIT",
        amount: rakebackAmount,
        balanceBefore: toNum(user.availableBalance),
        balanceAfter: toNum(addMoney(user.availableBalance, rakebackAmount)),
        description: `Rakeback ${data.period} - ${data.rakebackPercent}% de €${data.rakeGenerated.toFixed(2)}`,
        referenceType: "RAKEBACK",
        createdBy: session.user.id,
      },
    }),
    prisma.user.update({
      where: { id: data.userId },
      data: {
        availableBalance: { increment: rakebackAmount },
        totalRakeback: { increment: rakebackAmount },
        lifetimeEarnings: { increment: rakebackAmount },
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "RAKEBACK_LOADED",
        entityType: "user",
        entityId: data.userId,
        details: {
          amount: rakebackAmount,
          rakeGenerated: data.rakeGenerated,
          rakebackPercent: data.rakebackPercent,
          period: data.period,
          roomId: data.roomId,
        },
      },
    }),
  ]);

  return { success: true };
}

export async function updateUserBalances(data: {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalRakeback: number;
  investedBalance: number;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const rl = await rateLimit(RateLimits.adminMoney, session.user.id);
  if (!rl.success) return { error: "Rate limit: espera unos segundos" };

  const before = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      availableBalance: true,
      pendingBalance: true,
      totalRakeback: true,
      investedBalance: true,
    },
  });
  if (!before) return { error: "Usuario no encontrado" };

  const delta = data.availableBalance - toNum(before.availableBalance);

  const beforeNum = {
    availableBalance: toNum(before.availableBalance),
    pendingBalance: toNum(before.pendingBalance),
    totalRakeback: toNum(before.totalRakeback),
    investedBalance: toNum(before.investedBalance),
  };

  await prisma.$transaction([
    ...(delta !== 0
      ? [
          prisma.balanceTransaction.create({
            data: {
              userId: data.userId,
              type: "MANUAL_ADJUSTMENT",
              amount: delta,
              balanceBefore: beforeNum.availableBalance,
              balanceAfter: data.availableBalance,
              description: "Ajuste manual de saldo por admin",
              createdBy: session.user.id,
            },
          }),
        ]
      : []),
    prisma.user.update({
      where: { id: data.userId },
      data: {
        availableBalance: data.availableBalance,
        pendingBalance: data.pendingBalance,
        totalRakeback: data.totalRakeback,
        investedBalance: data.investedBalance,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "USER_BALANCES_UPDATED",
        entityType: "user",
        entityId: data.userId,
        details: {
          before: beforeNum,
          after: {
            availableBalance: data.availableBalance,
            pendingBalance: data.pendingBalance,
            totalRakeback: data.totalRakeback,
            investedBalance: data.investedBalance,
          },
        },
      },
    }),
  ]);

  return { success: true };
}

export async function adjustBalance(data: {
  userId: string;
  amount: number;
  description: string;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const rl = await rateLimit(RateLimits.adminMoney, session.user.id);
  if (!rl.success) return { error: "Rate limit: espera unos segundos" };

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { availableBalance: true },
  });

  if (!user) return { error: "Usuario no encontrado" };
  const projected = addMoney(user.availableBalance, data.amount);
  if (isNegative(projected)) {
    return { error: "El saldo no puede quedar negativo" };
  }
  const balanceBefore = toNum(user.availableBalance);
  const balanceAfter = toNum(projected);

  await prisma.$transaction([
    prisma.balanceTransaction.create({
      data: {
        userId: data.userId,
        type: "MANUAL_ADJUSTMENT",
        amount: data.amount,
        balanceBefore,
        balanceAfter,
        description: data.description,
        createdBy: session.user.id,
      },
    }),
    prisma.user.update({
      where: { id: data.userId },
      data: {
        availableBalance: { increment: data.amount },
        lifetimeEarnings: data.amount > 0 ? { increment: data.amount } : undefined,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "BALANCE_ADJUSTED",
        entityType: "user",
        entityId: data.userId,
        details: {
          delta: data.amount,
          balanceBefore,
          balanceAfter,
          reason: data.description,
        },
      },
    }),
  ]);

  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });

  return { success: true };
}

export async function updateUserStratum(userId: string, stratum: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.user.update({
    where: { id: userId },
    data: { stratum: stratum as any },
  });

  return { success: true };
}

export async function suspendUser(userId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.user.update({
    where: { id: userId },
    data: { status: "SUSPENDED" },
  });

  return { success: true };
}

export async function createRoom(data: {
  name: string;
  slug: string;
  affiliateCode: string;
  rakebackBase: number;
  rakebackPremium?: number | null;
  website?: string | null;
  description?: string | null;
  setupGuide?: string | null;
  vpnRequired?: boolean;
  vpnInstructions?: string | null;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.pokerRoom.create({ data: data as any });
  return { success: true };
}

export async function createService(data: {
  name: string;
  slug: string;
  category: string;
  description: string;
  shortDescription: string;
  icon?: string | null;
  priceEur: number;
  priceInBalance?: number | null;
  isRecurring?: boolean;
  recurringPeriod?: string | null;
  features?: string[];
  setupInstructions?: string | null;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.service.create({ data: data as any });
  return { success: true };
}

export async function sendNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.notification.create({ data });
  return { success: true };
}

export async function sendBulkNotification(data: {
  type: string;
  title: string;
  message: string;
  link?: string;
  filters?: { stratum?: string; role?: string };
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  const where: Record<string, unknown> = { deletedAt: null, status: "ACTIVE" };
  if (data.filters?.stratum) where.stratum = data.filters.stratum;
  if (data.filters?.role) where.role = data.filters.role;

  const users = await prisma.user.findMany({
    where,
    select: { id: true },
  });

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      type: data.type,
      title: data.title,
      message: data.message,
      link: data.link,
    })),
  });

  return { success: true, count: users.length };
}

export async function createKnowledgeArticle(data: {
  title: string;
  slug: string;
  content: string;
  category: string;
  isPublic: boolean;
  tags: string[];
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.knowledgeArticle.create({ data });
  return { success: true };
}

export async function updateKnowledgeArticle(id: string, data: {
  title?: string;
  content?: string;
  category?: string;
  isPublic?: boolean;
  tags?: string[];
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.knowledgeArticle.update({ where: { id }, data });
  return { success: true };
}

export async function fulfillOrder(orderId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;

  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });

  return { success: true };
}
