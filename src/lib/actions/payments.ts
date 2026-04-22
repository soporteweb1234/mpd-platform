"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, checkAdmin } from "@/lib/auth/guards";
import {
  createInvoice,
  getPaymentStatus,
  mapNowPaymentsStatus,
} from "@/lib/payments/nowpayments";
import { creditBalance } from "@/lib/wallet";
import type { PaymentIntentStatus } from "@prisma/client";

const DEPOSIT_MIN_USD = 20;
const DEPOSIT_MAX_USD = 10000;
const MAX_ACTIVE_INTENTS = 3;

const createSchema = z.object({
  amountUsd: z.number().min(DEPOSIT_MIN_USD).max(DEPOSIT_MAX_USD),
  network: z.enum(["TRC20", "BEP20", "ERC20"]),
});

type CreateResult =
  | {
      ok: true;
      intentId: string;
      payAddress: string;
      payAmount: string;
      payCurrency: string;
      expiresAt: string | null;
    }
  | { ok?: false; error: string };

export async function createDepositIntent(
  raw: unknown,
): Promise<CreateResult> {
  const session = await requireSession();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const activeCount = await prisma.paymentIntent.count({
    where: {
      userId: session.user.id,
      status: { in: ["WAITING", "CONFIRMING", "CONFIRMED"] },
    },
  });
  if (activeCount >= MAX_ACTIVE_INTENTS) {
    return {
      error: `Tienes ${activeCount} depósitos pendientes. Espera a que finalicen o expiren.`,
    };
  }

  const intent = await prisma.paymentIntent.create({
    data: {
      userId: session.user.id,
      provider: "NOWPAYMENTS",
      providerOrderId: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      amountUsd: parsed.data.amountUsd,
      network: parsed.data.network,
      payCurrency: "",
      status: "WAITING",
    },
    select: { id: true },
  });

  try {
    const base = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "";
    const ipnCallbackUrl = `${base.replace(/\/$/, "")}/api/payments/nowpayments/ipn`;

    const invoice = await createInvoice({
      userId: session.user.id,
      intentId: intent.id,
      amountUsd: parsed.data.amountUsd,
      network: parsed.data.network,
      ipnCallbackUrl,
    });

    const updated = await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        providerOrderId: invoice.paymentId,
        payAddress: invoice.payAddress,
        payAmount: invoice.payAmount,
        payCurrency: invoice.payCurrency,
        expiresAt: invoice.expiresAt,
      },
      select: {
        id: true,
        payAddress: true,
        payAmount: true,
        payCurrency: true,
        expiresAt: true,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_INTENT_CREATED",
        entityType: "PaymentIntent",
        entityId: updated.id,
        details: {
          amountUsd: parsed.data.amountUsd,
          network: parsed.data.network,
          providerOrderId: invoice.paymentId,
        },
      },
    });

    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/deposit");

    return {
      ok: true,
      intentId: updated.id,
      payAddress: updated.payAddress ?? "",
      payAmount: updated.payAmount ? updated.payAmount.toString() : "0",
      payCurrency: updated.payCurrency,
      expiresAt: updated.expiresAt ? updated.expiresAt.toISOString() : null,
    };
  } catch (err) {
    await prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: "FAILED", notes: err instanceof Error ? err.message : "unknown" },
    });
    return {
      error: err instanceof Error ? err.message : "Error creando depósito",
    };
  }
}

export async function getMyDepositIntents() {
  const session = await requireSession();
  const rows = await prisma.paymentIntent.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      amountUsd: true,
      network: true,
      payCurrency: true,
      payAddress: true,
      payAmount: true,
      status: true,
      creditedAt: true,
      txHash: true,
      createdAt: true,
      expiresAt: true,
    },
  });
  return rows;
}

export async function refreshIntentStatus(
  id: string,
): Promise<{ ok?: true; status?: PaymentIntentStatus; error?: string }> {
  const session = await requireSession();
  const intent = await prisma.paymentIntent.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      providerOrderId: true,
      status: true,
      amountUsd: true,
    },
  });
  if (!intent) return { error: "Intent no encontrado" };
  if (intent.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return { error: "No autorizado" };
  }
  if (intent.status === "FINISHED") return { ok: true, status: "FINISHED" };

  try {
    const remote = await getPaymentStatus(intent.providerOrderId);
    const mapped = mapNowPaymentsStatus(remote.status);

    if (mapped === "FINISHED") {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.paymentIntent.updateMany({
          where: { id: intent.id, creditedAt: null },
          data: {
            status: "FINISHED",
            creditedAt: new Date(),
            txHash: remote.txHash,
          },
        });
        if (updated.count === 1) {
          await creditBalance(
            tx,
            intent.userId,
            intent.amountUsd.toNumber(),
            "DEPOSIT_USDT",
            "Depósito USDT vía NOWPayments",
            null,
            "PaymentIntent",
          );
        }
      });
    } else if (mapped !== intent.status) {
      await prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { status: mapped, txHash: remote.txHash ?? undefined },
      });
    }

    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/deposit");
    return { ok: true, status: mapped };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Error" };
  }
}

const listSchema = z.object({
  status: z
    .enum(["WAITING", "CONFIRMING", "CONFIRMED", "FINISHED", "FAILED", "REFUNDED", "EXPIRED"])
    .optional(),
  userId: z.string().cuid().optional(),
  page: z.number().int().min(1).default(1),
});

export async function listPaymentIntents(raw: unknown) {
  const authz = await checkAdmin();
  if ("error" in authz) return { error: authz.error };
  const parsed = listSchema.safeParse(raw ?? {});
  if (!parsed.success) return { error: "Parámetros inválidos" };

  const pageSize = 50;
  const { status, userId, page } = parsed.data;
  const where = {
    ...(status ? { status } : {}),
    ...(userId ? { userId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.paymentIntent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        user: { select: { id: true, name: true, email: true } },
        webhookEvents: {
          orderBy: { receivedAt: "desc" },
          take: 5,
          select: {
            id: true,
            receivedAt: true,
            processed: true,
            processedAt: true,
            error: true,
          },
        },
      },
    }),
    prisma.paymentIntent.count({ where }),
  ]);

  return { ok: true as const, rows, total, page, pageSize };
}
