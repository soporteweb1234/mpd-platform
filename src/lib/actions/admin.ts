"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { creditBalance, debitBalance } from "@/lib/wallet";
import {
  rakebackLoadSchema,
  balanceAdjustSchema,
  type RakebackLoadInput,
  type BalanceAdjustInput,
} from "@/lib/validations";

export async function loadRakeback(input: RakebackLoadInput) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  const parsed = rakebackLoadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const rakebackAmount = (data.rakeGenerated * data.rakebackPercent) / 100;

  const userExists = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true },
  });
  if (!userExists) return { error: "Usuario no encontrado" };

  await prisma.$transaction(async (tx) => {
    await tx.rakebackRecord.create({
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
    });

    await creditBalance(
      tx,
      data.userId,
      rakebackAmount,
      "RAKEBACK_CREDIT",
      `Rakeback ${data.period} - ${data.rakebackPercent}% de €${data.rakeGenerated.toFixed(2)}`,
      session.user.id,
      "RAKEBACK",
    );

    await tx.user.update({
      where: { id: data.userId },
      data: {
        totalRakeback: { increment: rakebackAmount },
        lifetimeEarnings: { increment: rakebackAmount },
      },
    });
  });

  return { success: true };
}

export async function updateUserBalances(data: {
  userId: string;
  availableBalance: number;
  pendingBalance: number;
  totalRakeback: number;
  investedBalance: number;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: {
      availableBalance: true,
      pendingBalance: true,
      totalRakeback: true,
      investedBalance: true,
    },
  });
  if (!user) return { error: "Usuario no encontrado" };

  const availableDelta = new Prisma.Decimal(data.availableBalance).minus(user.availableBalance);
  const pendingDelta = new Prisma.Decimal(data.pendingBalance).minus(user.pendingBalance);
  const totalRakebackDelta = new Prisma.Decimal(data.totalRakeback).minus(user.totalRakeback);
  const investedDelta = new Prisma.Decimal(data.investedBalance).minus(user.investedBalance);

  try {
    await prisma.$transaction(async (tx) => {
      // availableBalance se mueve vía ledger (credit/debit)
      if (!availableDelta.isZero()) {
        if (availableDelta.isPositive()) {
          await creditBalance(
            tx,
            data.userId,
            availableDelta.toNumber(),
            "MANUAL_ADJUSTMENT",
            "Ajuste manual de saldo por admin",
            session.user.id,
          );
        } else {
          await debitBalance(
            tx,
            data.userId,
            availableDelta.abs().toNumber(),
            "MANUAL_ADJUSTMENT",
            "Ajuste manual de saldo por admin",
            session.user.id,
          );
        }
      }

      // Campos no-ledgered: increment atómico por delta
      const nonLedgered: Prisma.UserUpdateInput = {};
      if (!pendingDelta.isZero()) {
        nonLedgered.pendingBalance = { increment: pendingDelta.toNumber() };
      }
      if (!totalRakebackDelta.isZero()) {
        nonLedgered.totalRakeback = { increment: totalRakebackDelta.toNumber() };
      }
      if (!investedDelta.isZero()) {
        nonLedgered.investedBalance = { increment: investedDelta.toNumber() };
      }
      if (Object.keys(nonLedgered).length > 0) {
        await tx.user.update({
          where: { id: data.userId },
          data: nonLedgered,
        });
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Saldo insuficiente") {
      return { error: "Saldo insuficiente para aplicar el ajuste" };
    }
    throw err;
  }

  return { success: true };
}

export async function adjustBalance(input: BalanceAdjustInput) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  const parsed = balanceAdjustSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const userExists = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true },
  });
  if (!userExists) return { error: "Usuario no encontrado" };

  try {
    await prisma.$transaction(async (tx) => {
      if (data.amount > 0) {
        await creditBalance(
          tx,
          data.userId,
          data.amount,
          "MANUAL_ADJUSTMENT",
          data.description,
          session.user.id,
        );
        await tx.user.update({
          where: { id: data.userId },
          data: { lifetimeEarnings: { increment: data.amount } },
        });
      } else {
        await debitBalance(
          tx,
          data.userId,
          Math.abs(data.amount),
          "MANUAL_ADJUSTMENT",
          data.description,
          session.user.id,
        );
      }
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Saldo insuficiente") {
      return { error: "El saldo no puede quedar negativo" };
    }
    throw err;
  }

  return { success: true };
}

export async function updateUserRole(userId: string, role: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: role as any },
  });

  return { success: true };
}

export async function updateUserStratum(userId: string, stratum: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { stratum: stratum as any },
  });

  return { success: true };
}

export async function suspendUser(userId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  await prisma.knowledgeArticle.update({ where: { id }, data });
  return { success: true };
}

export async function fulfillOrder(orderId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  await prisma.serviceOrder.update({
    where: { id: orderId },
    data: { status: "DELIVERED", deliveredAt: new Date() },
  });

  return { success: true };
}
