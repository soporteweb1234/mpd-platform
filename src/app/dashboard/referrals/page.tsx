import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { CopyReferralCode } from "@/components/shared/CopyReferralCode";
import { ReferralStatsCards } from "@/components/dashboard/ReferralStatsCards";
import { ReferralAttributionsTable } from "@/components/dashboard/ReferralAttributionsTable";
import { ReferralLeaderboard } from "@/components/dashboard/ReferralLeaderboard";
import { ReferralShareButtons } from "@/components/dashboard/ReferralShareButtons";

export const metadata = { title: "Referidos" };
export const dynamic = "force-dynamic";

type AttributionRow = {
  id: string;
  createdAt: string;
  amount: number;
  commissionPct: number;
  level: number;
  status: string;
  referredLabel: string;
};

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      referrals: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          nickname: true,
          stratum: true,
          status: true,
          createdAt: true,
          totalRakeback: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const [attributionsRaw, lifetimeAgg, pendingAgg, policy, topRaw] = await Promise.all([
    prisma.referralAttribution.findMany({
      where: { referrerId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        referred: { select: { name: true, nickname: true } },
      },
    }),
    prisma.referralAttribution.aggregate({
      where: { referrerId: session.user.id, status: "AVAILABLE" },
      _sum: { amount: true },
    }),
    prisma.referralAttribution.aggregate({
      where: { referrerId: session.user.id, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.referralPolicy.findUnique({ where: { id: "global" } }),
    prisma.referralAttribution.groupBy({
      by: ["referrerId"],
      where: {
        status: { in: ["AVAILABLE", "PENDING"] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 50,
    }),
  ]);

  const totalReferrals = user?.referrals.length ?? 0;
  const activeReferrals = user?.referrals.filter((r) => r.status === "ACTIVE").length ?? 0;
  const conversionRate = totalReferrals > 0 ? activeReferrals / totalReferrals : 0;
  const kFactor = Number(
    (
      (await averageReferralsPerUser()) * conversionRate
    ).toFixed(2),
  );

  const attributions: AttributionRow[] = attributionsRaw.map((a) => ({
    id: a.id,
    createdAt: a.createdAt.toISOString(),
    amount: a.amount.toNumber(),
    commissionPct: a.commissionPct.toNumber(),
    level: a.level,
    status: a.status,
    referredLabel: a.referred?.nickname ?? a.referred?.name ?? "—",
  }));

  const lifetimeEarnings = lifetimeAgg._sum.amount?.toNumber() ?? 0;
  const pendingEarnings = pendingAgg._sum.amount?.toNumber() ?? 0;

  const topReferrerIds = topRaw.map((t) => t.referrerId);
  const topUsers = topReferrerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: topReferrerIds }, leaderboardOptOut: false },
        select: { id: true, nickname: true, name: true, stratum: true },
      })
    : [];

  const leaderboard = topRaw
    .map((t) => {
      const u = topUsers.find((x) => x.id === t.referrerId);
      if (!u) return null;
      return {
        userId: t.referrerId,
        label: u.nickname ?? u.name,
        stratum: u.stratum,
        total: t._sum.amount?.toNumber() ?? 0,
        isMe: t.referrerId === session.user.id,
      };
    })
    .filter(Boolean)
    .slice(0, 20);

  const publicBase = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const shareUrl = `${publicBase.replace(/\/$/, "")}/ref/${user?.referralCode ?? ""}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Referidos</h1>

      <Card className="border-mpd-gold/20">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-medium text-mpd-white mb-1">Tu código de referido</h3>
              <p className="text-xs text-mpd-gray">
                Comparte tu enlace: ganas L1={policy?.defaultL1Percent.toString() ?? "10"}% del
                rakeback de cada referido + L2={policy?.defaultL2Percent.toString() ?? "2"}% en
                segundo nivel.
              </p>
            </div>
            <CopyReferralCode code={user?.referralCode ?? ""} />
          </div>
          {user?.referralCode && (
            <ReferralShareButtons url={shareUrl} code={user.referralCode} />
          )}
        </CardContent>
      </Card>

      <ReferralStatsCards
        totalReferrals={totalReferrals}
        activeReferrals={activeReferrals}
        kFactor={kFactor}
        lifetimeEarnings={lifetimeEarnings}
        pendingEarnings={pendingEarnings}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de comisiones</CardTitle>
        </CardHeader>
        <CardContent>
          {attributions.length > 0 ? (
            <ReferralAttributionsTable attributions={attributions} />
          ) : (
            <EmptyState
              title="Sin comisiones aún"
              description="Cuando tus referidos generen rakeback, verás el histórico aquí."
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.referrals && user.referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border">
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Jugador</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Registro</th>
                    <th className="text-center py-3 px-2 text-mpd-gray font-medium">Estrato</th>
                    <th className="text-center py-3 px-2 text-mpd-gray font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {user.referrals.map((ref) => (
                    <tr
                      key={ref.id}
                      className="border-b border-mpd-border/50 hover:bg-mpd-surface-hover/50"
                    >
                      <td className="py-3 px-2 text-mpd-white">{ref.nickname ?? ref.name}</td>
                      <td className="py-3 px-2 text-mpd-gray">{formatDate(ref.createdAt)}</td>
                      <td className="py-3 px-2 text-center">
                        <BadgeStratum stratum={ref.stratum} />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <BadgeStatus status={ref.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin referidos"
              description="Comparte tu código y empieza a ganar comisiones."
            />
          )}
        </CardContent>
      </Card>

      {policy?.leaderboardEnabled && leaderboard.length > 0 && (
        <ReferralLeaderboard rows={leaderboard as Array<{
          userId: string; label: string; stratum: string; total: number; isMe: boolean;
        }>} />
      )}
    </div>
  );
}

async function averageReferralsPerUser(): Promise<number> {
  const [refUsers, total] = await Promise.all([
    prisma.user.count({ where: { referrals: { some: {} } } }),
    prisma.user.count({ where: { referredById: { not: null } } }),
  ]);
  if (refUsers === 0) return 0;
  return total / refUsers;
}
