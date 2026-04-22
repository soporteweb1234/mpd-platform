import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Landmark } from "lucide-react";
import { StakingDealsTable } from "@/components/admin/StakingDealsTable";

export const metadata = { title: "MPD Staking — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminStakingPage() {
  await requireAdmin();

  const [deals, users] = await Promise.all([
    prisma.stakingDeal.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { periods: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: "PLAYER" },
      orderBy: { createdAt: "desc" },
      take: 500,
      select: { id: true, name: true, email: true },
    }),
  ]);

  const serialized = deals.map((d) => ({
    id: d.id,
    userId: d.userId,
    user: d.user,
    totalBankroll: d.totalBankroll,
    mpdContribution: d.mpdContribution,
    playerContribution: d.playerContribution,
    profitSplitMpd: d.profitSplitMpd,
    profitSplitPlayer: d.profitSplitPlayer,
    status: d.status,
    startDate: d.startDate ? d.startDate.toISOString() : null,
    endDate: d.endDate ? d.endDate.toISOString() : null,
    currentMakeup: d.currentMakeup,
    totalProfit: d.totalProfit,
    totalLoss: d.totalLoss,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
    periodsCount: d._count.periods,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">MPD Staking</h1>
          <p className="text-sm text-mpd-gray">
            {deals.length} {deals.length === 1 ? "deal" : "deals"} (últimos 200)
          </p>
        </div>
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Landmark className="h-10 w-10 mx-auto text-mpd-gray mb-3" />
            <p className="text-sm text-mpd-gray">
              No hay deals todavía. Crea el primero desde el botón.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <StakingDealsTable deals={serialized} users={users} />
    </div>
  );
}
