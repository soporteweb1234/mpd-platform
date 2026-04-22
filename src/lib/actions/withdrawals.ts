"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { debitBalance } from "@/lib/wallet";
import { revalidatePath } from "next/cache";
import {
  WITHDRAWAL_NETWORKS,
  WITHDRAWAL_FEES,
  WITHDRAWAL_MIN_USD,
  type WithdrawalNetwork,
} from "@/lib/wallets/constants";
import { Prisma } from "@prisma/client";

const addressPattern = /^[a-zA-Z0-9:_-]{20,120}$/;

const CreateWithdrawalSchema = z.object({
  network: z.enum(WITHDRAWAL_NETWORKS),
  toAddress: z
    .string()
    .trim()
    .regex(addressPattern, "Dirección no válida"),
  amountUsd: z
    .number()
    .finite()
    .positive("La cantidad debe ser mayor que 0"),
});

export async function createWithdrawalRequest(raw: unknown) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "No autenticado" } as const;
  }

  const parsed = CreateWithdrawalSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos no válidos",
    } as const;
  }

  const { network, toAddress, amountUsd } = parsed.data;

  if (amountUsd < WITHDRAWAL_MIN_USD) {
    return {
      ok: false,
      error: `El mínimo de retiro es ${WITHDRAWAL_MIN_USD} USDT`,
    } as const;
  }

  const fee = WITHDRAWAL_FEES[network as WithdrawalNetwork];
  if (amountUsd <= fee) {
    return {
      ok: false,
      error: `El importe debe superar la comisión (${fee} USDT)`,
    } as const;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await debitBalance(
        tx,
        session.user.id,
        amountUsd,
        "WITHDRAWAL",
        `Solicitud de retiro USDT ${network} → ${toAddress.slice(0, 10)}…`,
        session.user.id,
      );

      const req = await tx.withdrawalRequest.create({
        data: {
          userId: session.user.id,
          amountUsd: new Prisma.Decimal(amountUsd),
          network,
          toAddress,
          status: "PENDING",
          note: `fee=${fee}`,
        },
        select: { id: true },
      });

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "WITHDRAWAL_REQUESTED",
          entityType: "withdrawal_request",
          entityId: req.id,
          details: { amountUsd, network, fee, toAddress },
        },
      });

      return req;
    });

    revalidatePath("/dashboard/balance");
    return { ok: true, id: result.id } as const;
  } catch (err) {
    if (err instanceof Error && err.message === "Saldo insuficiente") {
      return { ok: false, error: "Saldo insuficiente" } as const;
    }
    throw err;
  }
}
