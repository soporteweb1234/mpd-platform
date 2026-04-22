import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  verifyIpnSignature,
  mapNowPaymentsStatus,
  type NowPaymentsStatus,
} from "@/lib/payments/nowpayments";
import { creditBalance } from "@/lib/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type IpnPayload = {
  payment_id?: number | string;
  payment_status?: NowPaymentsStatus;
  order_id?: string;
  pay_amount?: number;
  actually_paid?: number;
  payin_hash?: string;
  outcome_amount?: number;
};

function hashBody(body: string): string {
  return crypto.createHash("sha256").update(body).digest("hex");
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!rawBody) {
    return NextResponse.json({ error: "empty body" }, { status: 400 });
  }

  const signature = req.headers.get("x-nowpayments-sig");
  const eventHash = hashBody(rawBody);

  let payload: IpnPayload;
  try {
    payload = JSON.parse(rawBody) as IpnPayload;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const providerOrderId = payload.payment_id ? String(payload.payment_id) : null;
  if (!providerOrderId || !payload.payment_status) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  if (!verifyIpnSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const intent = await prisma.paymentIntent.findUnique({
    where: { providerOrderId },
    select: {
      id: true,
      userId: true,
      amountUsd: true,
      status: true,
      creditedAt: true,
    },
  });
  if (!intent) {
    return NextResponse.json({ error: "intent not found" }, { status: 404 });
  }

  const existing = await prisma.paymentWebhookEvent.findUnique({
    where: { eventHash },
    select: { id: true, processed: true },
  });
  if (existing?.processed) {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const webhookEvent = existing
    ? existing
    : await prisma.paymentWebhookEvent.create({
        data: {
          intentId: intent.id,
          eventHash,
          payload: payload as unknown as object,
        },
        select: { id: true, processed: true },
      });

  const mapped = mapNowPaymentsStatus(payload.payment_status);

  try {
    if (mapped === "FINISHED" && !intent.creditedAt) {
      await prisma.$transaction(async (tx) => {
        const updated = await tx.paymentIntent.updateMany({
          where: { id: intent.id, creditedAt: null },
          data: {
            status: "FINISHED",
            creditedAt: new Date(),
            txHash: payload.payin_hash ?? null,
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
        await tx.paymentWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true, processedAt: new Date() },
        });
      });
    } else {
      await prisma.$transaction([
        prisma.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: mapped,
            txHash: payload.payin_hash ?? undefined,
          },
        }),
        prisma.paymentWebhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true, processedAt: new Date() },
        }),
      ]);
    }

    revalidatePath("/dashboard/balance");
    revalidatePath("/dashboard/balance/deposit");
    revalidatePath("/admin/payments");

    return NextResponse.json({ ok: true, status: mapped });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    await prisma.paymentWebhookEvent
      .update({
        where: { id: webhookEvent.id },
        data: { error: message },
      })
      .catch(() => {});
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
