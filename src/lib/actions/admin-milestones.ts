"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";

const schema = z.object({
  code: z.string().min(3).max(64).regex(/^[a-z0-9_]+$/),
  label: z.string().min(1).max(120),
  description: z.string().max(1000).optional().or(z.literal("")),
  threshold: z.number().positive(),
  metric: z.enum(["lifetime_rakeback", "active_days", "first_deposit"]),
  bonusAmount: z.number().positive(),
  active: z.boolean().default(true),
});

export async function createMilestone(raw: unknown) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  try {
    const m = await prisma.referralMilestone.create({
      data: {
        ...parsed.data,
        description: parsed.data.description?.trim() || null,
      },
      select: { id: true },
    });
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "MILESTONE_CREATED",
        entityType: "ReferralMilestone",
        entityId: m.id,
        details: { code: parsed.data.code },
      },
    });
    revalidatePath("/admin/referrals/milestones");
    return { ok: true, id: m.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Error creando milestone",
    };
  }
}

export async function updateMilestone(id: string, raw: unknown) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const partial = schema.partial().safeParse(raw);
  if (!partial.success) return { error: partial.error.issues[0].message };

  await prisma.referralMilestone.update({
    where: { id },
    data: {
      ...partial.data,
      description:
        partial.data.description === undefined
          ? undefined
          : partial.data.description?.trim() || null,
    },
  });

  revalidatePath("/admin/referrals/milestones");
  return { ok: true };
}

export async function toggleMilestone(id: string, active: boolean) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  await prisma.referralMilestone.update({ where: { id }, data: { active } });
  revalidatePath("/admin/referrals/milestones");
  return { ok: true };
}

export async function deleteMilestone(id: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  await prisma.referralMilestone.delete({ where: { id } });
  revalidatePath("/admin/referrals/milestones");
  return { ok: true };
}
