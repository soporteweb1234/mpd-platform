"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/guards";

export async function getMyStakingDeals() {
  const session = await requireSession();
  const deals = await prisma.stakingDeal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      periods: {
        orderBy: { periodStart: "desc" },
        take: 20,
      },
    },
  });
  return deals;
}

export async function acceptStakingDeal(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await requireSession();

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, startDate: true },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.userId !== session.user.id) return { error: "No autorizado" };
  if (deal.status !== "PROPOSED") {
    return { error: `Estado ${deal.status} no permite aceptar` };
  }

  await prisma.stakingDeal.update({
    where: { id },
    data: { status: "ACTIVE", startDate: deal.startDate ?? new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_ACCEPTED",
      entityType: "StakingDeal",
      entityId: id,
      details: {},
    },
  });

  revalidatePath("/dashboard/staking");
  revalidatePath("/admin/staking");
  revalidatePath(`/admin/staking/${id}`);
  return { ok: true };
}

export async function rejectStakingDeal(
  id: string,
  reason?: string,
): Promise<{ ok?: true; error?: string }> {
  const session = await requireSession();

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!deal) return { error: "Deal no encontrado" };
  if (deal.userId !== session.user.id) return { error: "No autorizado" };
  if (deal.status !== "PROPOSED") {
    return { error: `Estado ${deal.status} no permite rechazar` };
  }

  await prisma.stakingDeal.update({
    where: { id },
    data: { status: "CANCELLED", endDate: new Date() },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "STAKING_DEAL_REJECTED",
      entityType: "StakingDeal",
      entityId: id,
      details: { reason: reason?.trim() || null },
    },
  });

  revalidatePath("/dashboard/staking");
  revalidatePath("/admin/staking");
  revalidatePath(`/admin/staking/${id}`);
  return { ok: true };
}
