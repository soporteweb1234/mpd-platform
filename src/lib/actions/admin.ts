"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { checkAdmin } from "@/lib/auth/guards";
import { creditBalance, debitBalance } from "@/lib/wallet";
import { rateLimit, RateLimits } from "@/lib/security/ratelimit";
import {
  rakebackLoadSchema,
  balanceAdjustSchema,
  type RakebackLoadInput,
  type BalanceAdjustInput,
} from "@/lib/validations";

export async function loadRakeback(input: RakebackLoadInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const rl = await rateLimit(RateLimits.adminMoney, session.user.id);
  if (!rl.success) return { error: "Rate limit: espera unos segundos" };

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

    await tx.activityLog.create({
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
    });
  });

  revalidatePath("/admin/rakeback");
  revalidatePath(`/admin/users/${data.userId}`);
  revalidatePath("/dashboard/rakeback");
  revalidatePath("/dashboard");
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

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "USER_BALANCES_UPDATED",
          entityType: "user",
          entityId: data.userId,
          details: {
            before: {
              availableBalance: user.availableBalance.toString(),
              pendingBalance: user.pendingBalance.toString(),
              totalRakeback: user.totalRakeback.toString(),
              investedBalance: user.investedBalance.toString(),
            },
            after: {
              availableBalance: data.availableBalance,
              pendingBalance: data.pendingBalance,
              totalRakeback: data.totalRakeback,
              investedBalance: data.investedBalance,
            },
          },
        },
      });
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
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const rl = await rateLimit(RateLimits.adminMoney, session.user.id);
  if (!rl.success) return { error: "Rate limit: espera unos segundos" };

  const parsed = balanceAdjustSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const userBefore = await prisma.user.findUnique({
    where: { id: data.userId },
    select: { id: true, availableBalance: true },
  });
  if (!userBefore) return { error: "Usuario no encontrado" };

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

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "BALANCE_ADJUSTED",
          entityType: "user",
          entityId: data.userId,
          details: {
            delta: data.amount,
            balanceBefore: userBefore.availableBalance.toString(),
            reason: data.description,
          },
        },
      });
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
  revalidatePath("/admin/rooms");
  revalidatePath("/dashboard/rooms");
  return { success: true };
}

/** CAMBIOS 21.3 — edición completa de una sala existente (FASE 4.A.6) */
export type UpdateRoomInput = {
  name: string;
  slug: string;
  affiliateCode: string;
  rakebackBase: number;
  rakebackPremium?: number | null;
  logo?: string | null;
  website?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  description?: string | null;
  setupGuide?: string | null;
  registrationCode?: string | null;
  master?: string | null;
  dealCurrent?: number | null;
  dealMax?: number | null;
  rating?: number | null;
  vpnRequired?: boolean;
  vpnInstructions?: string | null;
  requiresRenting?: boolean;
  noKyc?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  sortOrder?: number;
};

export async function updateRoom(roomId: string, input: UpdateRoomInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!roomId) return { error: "Sala inválida" };
  if (!input.name?.trim()) return { error: "Nombre requerido" };
  if (!input.slug?.trim()) return { error: "Slug requerido" };
  if (!input.affiliateCode?.trim()) return { error: "Código de afiliado requerido" };
  if (typeof input.rakebackBase !== "number" || input.rakebackBase < 0 || input.rakebackBase > 100) {
    return { error: "Rakeback base inválido (0–100)" };
  }
  if (input.rating != null && (input.rating < 1 || input.rating > 5)) {
    return { error: "Rating debe estar entre 1 y 5" };
  }

  const before = await prisma.pokerRoom.findUnique({
    where: { id: roomId },
    select: { id: true, rakebackBase: true, status: true, dealCurrent: true },
  });
  if (!before) return { error: "Sala no encontrada" };

  await prisma.$transaction([
    prisma.pokerRoom.update({
      where: { id: roomId },
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        affiliateCode: input.affiliateCode.trim(),
        rakebackBase: input.rakebackBase,
        rakebackPremium: input.rakebackPremium ?? null,
        logo: input.logo?.trim() || null,
        website: input.website?.trim() || null,
        shortDescription: input.shortDescription?.trim() || null,
        longDescription: input.longDescription?.trim() || null,
        description: input.description?.trim() || null,
        setupGuide: input.setupGuide?.trim() || null,
        registrationCode: input.registrationCode?.trim() || null,
        master: input.master?.trim() || null,
        dealCurrent: input.dealCurrent ?? null,
        dealMax: input.dealMax ?? null,
        rating: input.rating ?? null,
        vpnRequired: input.vpnRequired ?? false,
        vpnInstructions: input.vpnInstructions?.trim() || null,
        requiresRenting: input.requiresRenting ?? false,
        noKyc: input.noKyc ?? false,
        status: input.status ?? undefined,
        sortOrder: input.sortOrder ?? undefined,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ROOM_UPDATED",
        entityType: "pokerRoom",
        entityId: roomId,
        details: {
          rakebackBaseBefore: before.rakebackBase,
          rakebackBaseAfter: input.rakebackBase,
          statusBefore: before.status,
          statusAfter: input.status ?? before.status,
          dealBefore: before.dealCurrent,
          dealAfter: input.dealCurrent ?? null,
        },
      },
    }),
  ]);

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${roomId}`);
  revalidatePath("/dashboard/rooms");
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
  revalidatePath("/admin/services");
  revalidatePath("/dashboard/services");
  return { success: true };
}

/** CAMBIOS 22 — edición completa de un servicio (FASE 4.A.7) */
export type UpdateServiceInput = {
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
  status?: "AVAILABLE" | "COMING_SOON" | "DISCONTINUED";
  requiredStratum?: "NOVATO" | "SEMI_PRO" | "PROFESIONAL" | "REFERENTE" | null;
  sortOrder?: number;
  priceVisible?: boolean;
  locked?: boolean;
  lockedLabel?: string | null;
};

export async function updateService(serviceId: string, input: UpdateServiceInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!serviceId) return { error: "Servicio inválido" };
  if (!input.name?.trim()) return { error: "Nombre requerido" };
  if (!input.slug?.trim()) return { error: "Slug requerido" };
  if (typeof input.priceEur !== "number" || input.priceEur < 0) {
    return { error: "Precio inválido" };
  }

  const before = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, locked: true, priceVisible: true, status: true, priceEur: true },
  });
  if (!before) return { error: "Servicio no encontrado" };

  await prisma.$transaction([
    prisma.service.update({
      where: { id: serviceId },
      data: {
        name: input.name.trim(),
        slug: input.slug.trim(),
        category: input.category as any,
        description: input.description,
        shortDescription: input.shortDescription,
        icon: input.icon?.trim() || null,
        priceEur: input.priceEur,
        priceInBalance: input.priceInBalance ?? null,
        isRecurring: input.isRecurring ?? false,
        recurringPeriod: input.recurringPeriod ?? null,
        features: input.features ?? [],
        setupInstructions: input.setupInstructions?.trim() || null,
        status: input.status ?? undefined,
        requiredStratum: (input.requiredStratum ?? null) as any,
        sortOrder: input.sortOrder ?? undefined,
        priceVisible: input.priceVisible ?? true,
        locked: input.locked ?? false,
        lockedLabel: input.lockedLabel?.trim() || null,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SERVICE_UPDATED",
        entityType: "service",
        entityId: serviceId,
        details: {
          lockedBefore: before.locked,
          lockedAfter: input.locked ?? false,
          priceVisibleBefore: before.priceVisible,
          priceVisibleAfter: input.priceVisible ?? true,
          priceBefore: before.priceEur,
          priceAfter: input.priceEur,
          statusBefore: before.status,
          statusAfter: input.status ?? before.status,
        },
      },
    }),
  ]);

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/dashboard/services");
  return { success: true };
}

/** CAMBIOS 22 — toggle rápido del candado desde el edit */
export async function toggleServiceLock(serviceId: string, locked: boolean) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const current = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { id: true, locked: true },
  });
  if (!current) return { error: "Servicio no encontrado" };

  await prisma.$transaction([
    prisma.service.update({ where: { id: serviceId }, data: { locked } }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SERVICE_LOCK_TOGGLED",
        entityType: "service",
        entityId: serviceId,
        details: { from: current.locked, to: locked },
      },
    }),
  ]);

  revalidatePath("/admin/services");
  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/dashboard/services");
  return { success: true };
}

/** CAMBIOS 22 — añade un usuario a la whitelist del servicio */
export async function addServiceWhitelist(serviceId: string, userId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!serviceId || !userId) return { error: "Parámetros inválidos" };

  const [service, user] = await Promise.all([
    prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
  ]);
  if (!service) return { error: "Servicio no encontrado" };
  if (!user) return { error: "Usuario no encontrado" };

  await prisma.$transaction([
    prisma.serviceWhitelist.upsert({
      where: { serviceId_userId: { serviceId, userId } },
      create: { serviceId, userId, addedBy: session.user.id },
      update: {},
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SERVICE_WHITELIST_ADDED",
        entityType: "service",
        entityId: serviceId,
        details: { targetUserId: userId },
      },
    }),
  ]);

  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function removeServiceWhitelist(serviceId: string, userId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  await prisma.$transaction([
    prisma.serviceWhitelist.deleteMany({ where: { serviceId, userId } }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "SERVICE_WHITELIST_REMOVED",
        entityType: "service",
        entityId: serviceId,
        details: { targetUserId: userId },
      },
    }),
  ]);

  revalidatePath(`/admin/services/${serviceId}`);
  revalidatePath("/dashboard/services");
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

/** CAMBIOS 18.4 — notas comerciales privadas del admin sobre un usuario */
export async function updateAdminNotes(userId: string, notes: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (typeof notes !== "string") return { error: "Formato inválido" };
  const trimmed = notes.trim().slice(0, 4000);

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) return { error: "Usuario no encontrado" };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { adminNotes: trimmed.length === 0 ? null : trimmed },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_NOTES_UPDATED",
        entityType: "user",
        entityId: userId,
        details: { length: trimmed.length },
      },
    }),
  ]);

  revalidatePath(`/admin/users/${userId}`);
  return { success: true };
}
