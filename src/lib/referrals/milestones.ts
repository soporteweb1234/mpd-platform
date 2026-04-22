import { Prisma } from "@prisma/client";
import { creditBalance } from "@/lib/wallet";

type Tx = Prisma.TransactionClient;

export async function evaluateMilestones(tx: Tx, referredUserId: string): Promise<void> {
  const referred = await tx.user.findUnique({
    where: { id: referredUserId },
    select: {
      id: true,
      referredById: true,
      totalRakeback: true,
    },
  });
  if (!referred?.referredById) return;

  const milestones = await tx.referralMilestone.findMany({
    where: { active: true, metric: "lifetime_rakeback" },
    select: {
      id: true,
      code: true,
      label: true,
      threshold: true,
      bonusAmount: true,
    },
  });
  if (milestones.length === 0) return;

  const lifetime = referred.totalRakeback.toNumber();

  for (const m of milestones) {
    if (lifetime < m.threshold.toNumber()) continue;

    try {
      await tx.referralMilestoneAward.create({
        data: {
          milestoneId: m.id,
          referrerId: referred.referredById,
          referredId: referred.id,
          amount: m.bonusAmount,
        },
      });
      await creditBalance(
        tx,
        referred.referredById,
        m.bonusAmount.toNumber(),
        "REFERRAL_COMMISSION",
        `Milestone: ${m.label}`,
        null,
        "ReferralMilestoneAward",
      );
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue; // ya otorgado
      }
      throw err;
    }
  }
}
