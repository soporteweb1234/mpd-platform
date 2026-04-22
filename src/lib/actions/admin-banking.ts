"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import type { BankingCandidateStatus } from "@prisma/client";

type ReviewDecision = Exclude<BankingCandidateStatus, "PENDING">;

function revalidateBanking(userId?: string) {
  revalidatePath("/admin/banking");
  if (userId) revalidatePath(`/admin/banking/${userId}`);
  revalidatePath("/dashboard/banking");
}

export async function reviewBankingCandidate(data: {
  candidateId: string;
  decision: ReviewDecision;
  notes?: string;
}) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!["REVIEWING", "APPROVED", "REJECTED"].includes(data.decision)) {
    return { error: "Decisión no válida" };
  }

  const candidate = await prisma.bankingCandidate.findUnique({
    where: { id: data.candidateId },
    select: { id: true, userId: true, status: true },
  });
  if (!candidate) return { error: "Candidatura no encontrada" };

  await prisma.$transaction([
    prisma.bankingCandidate.update({
      where: { id: candidate.id },
      data: {
        status: data.decision,
        notes: data.notes?.trim() || null,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "BANKING_REVIEWED",
        entityType: "bankingCandidate",
        entityId: candidate.id,
        details: {
          targetUserId: candidate.userId,
          previousStatus: candidate.status,
          decision: data.decision,
          notes: data.notes ?? null,
        },
      },
    }),
  ]);

  revalidateBanking(candidate.userId);
  return { success: true };
}
