"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { creditBalance } from "@/lib/wallet";

export async function markAttributionOk(id: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const att = await prisma.referralAttribution.findUnique({
    where: { id },
    select: { id: true, status: true, referrerId: true, amount: true },
  });
  if (!att) return { error: "Attribution no encontrada" };
  if (att.status === "AVAILABLE") return { ok: true };
  if (att.status !== "HELD" && att.status !== "PENDING") {
    return { error: `Estado ${att.status} no permite liberar` };
  }

  await prisma.$transaction(async (tx) => {
    const upd = await tx.referralAttribution.updateMany({
      where: { id, status: { in: ["HELD", "PENDING"] } },
      data: { status: "AVAILABLE", paidAt: new Date(), flaggedReason: null },
    });
    if (upd.count !== 1) return;
    await creditBalance(
      tx,
      att.referrerId,
      att.amount.toNumber(),
      "REFERRAL_COMMISSION",
      "Comisión referido (liberada por admin)",
      session.user.id,
      "ReferralAttribution",
    );
    await tx.user.update({
      where: { id: att.referrerId },
      data: { pendingBalance: { decrement: att.amount } },
    });
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "ATTRIBUTION_FORCE_OK",
      entityType: "ReferralAttribution",
      entityId: id,
      details: {},
    },
  });

  revalidatePath("/admin/referrals/attributions");
  return { ok: true };
}

export async function markAttributionFraud(id: string, reason?: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const att = await prisma.referralAttribution.findUnique({
    where: { id },
    select: { id: true, status: true, referrerId: true, amount: true },
  });
  if (!att) return { error: "Attribution no encontrada" };
  if (att.status === "AVAILABLE") {
    return { error: "Ya fue acreditada. No se puede revertir desde aquí." };
  }

  await prisma.$transaction(async (tx) => {
    const upd = await tx.referralAttribution.updateMany({
      where: { id, status: { in: ["PENDING", "HELD"] } },
      data: {
        status: "REJECTED",
        flaggedReason: reason ?? "manual_reject",
      },
    });
    if (upd.count !== 1) return;
    await tx.user.update({
      where: { id: att.referrerId },
      data: { pendingBalance: { decrement: att.amount } },
    });
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "ATTRIBUTION_REJECTED",
      entityType: "ReferralAttribution",
      entityId: id,
      details: { reason: reason ?? null },
    },
  });

  revalidatePath("/admin/referrals/attributions");
  return { ok: true };
}

const resolveSchema = z.object({
  decision: z.enum(["OK", "FRAUD"]),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export async function resolveFraudFlag(id: string, raw: unknown) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = resolveSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const flag = await prisma.referralFraudFlag.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!flag) return { error: "Flag no encontrado" };
  if (flag.status !== "OPEN") return { error: "Flag ya resuelto" };

  const nextStatus = parsed.data.decision === "OK" ? "REVIEWED_OK" : "CONFIRMED_FRAUD";

  await prisma.referralFraudFlag.update({
    where: { id },
    data: {
      status: nextStatus,
      resolvedBy: session.user.id,
      resolvedAt: new Date(),
      notes: parsed.data.notes?.trim() || null,
    },
  });

  if (parsed.data.decision === "OK") {
    await prisma.referralAttribution.updateMany({
      where: {
        status: "HELD",
        OR: [{ referrerId: flag.userId }, { referredId: flag.userId }],
      },
      data: { status: "PENDING", flaggedReason: null },
    });
  } else {
    await prisma.referralAttribution.updateMany({
      where: {
        status: { in: ["PENDING", "HELD"] },
        OR: [{ referrerId: flag.userId }, { referredId: flag.userId }],
      },
      data: { status: "REJECTED" },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "FRAUD_FLAG_RESOLVED",
      entityType: "ReferralFraudFlag",
      entityId: id,
      details: { decision: parsed.data.decision },
    },
  });

  revalidatePath("/admin/referrals/fraud");
  revalidatePath("/admin/referrals/attributions");
  return { ok: true };
}
