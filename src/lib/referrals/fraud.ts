import { prisma } from "@/lib/prisma";

type FraudCandidate = {
  userId: string;
  reason: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  evidence: Record<string, unknown>;
};

function canonicalEmail(email: string): string {
  const [localRaw, domain] = email.toLowerCase().split("@");
  if (!domain) return email.toLowerCase();
  const local = localRaw.split("+")[0].replace(/\./g, "");
  return `${local}@${domain}`;
}

export async function scanSameIpClusters(): Promise<FraudCandidate[]> {
  const rows = await prisma.$queryRaw<
    Array<{ signupIp: string; ids: string[]; n: number }>
  >`
    SELECT "signupIp",
           array_agg("id") AS ids,
           COUNT(*)::int AS n
    FROM "User"
    WHERE "signupIp" IS NOT NULL
      AND "signupIp" <> ''
      AND "createdAt" > NOW() - INTERVAL '30 days'
    GROUP BY "signupIp"
    HAVING COUNT(*) >= 3
    LIMIT 100
  `;

  const candidates: FraudCandidate[] = [];
  for (const r of rows) {
    const linked = await prisma.user.findMany({
      where: { id: { in: r.ids } },
      select: { id: true, referredById: true },
    });
    const ids = new Set(linked.map((u) => u.id));
    const refPair = linked.some(
      (u) => u.referredById && ids.has(u.referredById),
    );
    if (!refPair) continue;

    for (const u of linked) {
      candidates.push({
        userId: u.id,
        reason: "same_ip_cluster",
        severity: r.n >= 5 ? "HIGH" : "MEDIUM",
        evidence: { signupIp: r.signupIp, clusterSize: r.n, userIds: r.ids },
      });
    }
  }
  return candidates;
}

export async function scanSelfReferralPatterns(): Promise<FraudCandidate[]> {
  const pairs = await prisma.user.findMany({
    where: {
      referredById: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
      referredBy: { select: { id: true, email: true, createdAt: true } },
    },
    take: 500,
  });

  const candidates: FraudCandidate[] = [];
  for (const p of pairs) {
    if (!p.referredBy) continue;
    const canonA = canonicalEmail(p.email);
    const canonB = canonicalEmail(p.referredBy.email);
    const sameCanonical = canonA === canonB;
    const deltaSec =
      (p.createdAt.getTime() - p.referredBy.createdAt.getTime()) / 1000;
    const suspiciousTiming = Math.abs(deltaSec) < 60;

    if (sameCanonical || (suspiciousTiming && canonA.split("@")[1] === canonB.split("@")[1])) {
      candidates.push({
        userId: p.id,
        reason: sameCanonical ? "self_referral_detected" : "abnormal_conversion",
        severity: sameCanonical ? "HIGH" : "MEDIUM",
        evidence: {
          referrerId: p.referredBy.id,
          canonicalA: canonA,
          canonicalB: canonB,
          signupDeltaSec: deltaSec,
        },
      });
    }
  }
  return candidates;
}

export async function persistFraudFlags(
  candidates: FraudCandidate[],
): Promise<{ created: number; holdApplied: number }> {
  let created = 0;
  let holdApplied = 0;
  for (const c of candidates) {
    try {
      await prisma.referralFraudFlag.create({
        data: {
          userId: c.userId,
          reason: c.reason,
          severity: c.severity,
          evidence: c.evidence as object,
          status: "OPEN",
        },
      });
      created++;
    } catch {
      continue; // duplicated (unique constraint userId,reason,status)
    }
    if (c.severity === "HIGH") {
      const upd = await prisma.referralAttribution.updateMany({
        where: {
          status: "PENDING",
          OR: [{ referrerId: c.userId }, { referredId: c.userId }],
        },
        data: { status: "HELD", flaggedReason: c.reason },
      });
      holdApplied += upd.count;
    }
  }
  return { created, holdApplied };
}
