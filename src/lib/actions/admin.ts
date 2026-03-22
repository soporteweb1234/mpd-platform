"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

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
        balanceBefore: user.availableBalance,
        balanceAfter: user.availableBalance + rakebackAmount,
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
  ]);

  return { success: true };
}

export async function adjustBalance(data: {
  userId: string;
  amount: number;
  description: string;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    return { error: "No autorizado" };
  }

  const user = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { availableBalance: true },
  });

  if (!user) return { error: "Usuario no encontrado" };
  if (user.availableBalance + data.amount < 0) {
    return { error: "El saldo no puede quedar negativo" };
  }

  await prisma.$transaction([
    prisma.balanceTransaction.create({
      data: {
        userId: data.userId,
        type: "MANUAL_ADJUSTMENT",
        amount: data.amount,
        balanceBefore: user.availableBalance,
        balanceAfter: user.availableBalance + data.amount,
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
  ]);

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
