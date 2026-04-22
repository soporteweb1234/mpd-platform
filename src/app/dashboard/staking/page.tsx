import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/guards";
import { MyStakingDealsList } from "@/components/dashboard/MyStakingDealsList";

export const metadata = { title: "MPD Staking" };
export const dynamic = "force-dynamic";

export default async function StakingPage() {
  const session = await requireSession();

  const deals = await prisma.stakingDeal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      periods: { orderBy: { periodStart: "desc" }, take: 20 },
    },
  });

  const serialized = deals.map((d) => ({
    id: d.id,
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
    periods: d.periods.map((p) => ({
      id: p.id,
      periodStart: p.periodStart.toISOString(),
      periodEnd: p.periodEnd.toISOString(),
      profitLoss: p.profitLoss,
      makeupAfter: p.makeupAfter,
      mpdShare: p.mpdShare,
      playerShare: p.playerShare,
      notes: p.notes,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">MPD Staking</h1>
        <p className="text-sm text-mpd-gray">
          Tus deals de bancaje con Manager Poker Deal.
        </p>
      </div>

      {serialized.length === 0 ? (
        <Card className="border-mpd-gold/20">
          <CardContent className="p-10 text-center">
            <div className="h-14 w-14 mx-auto rounded-2xl bg-mpd-gold/10 flex items-center justify-center text-mpd-gold mb-4">
              <Landmark className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-mpd-white mb-1">
              Aún no tienes deals de staking
            </h2>
            <p className="text-sm text-mpd-gray max-w-lg mx-auto">
              Cuando el equipo de MPD te proponga un deal de bancaje aparecerá
              aquí. Podrás aceptarlo o rechazarlo y ver el historial de periodos
              en tiempo real.
            </p>
          </CardContent>
        </Card>
      ) : (
        <MyStakingDealsList deals={serialized} />
      )}
    </div>
  );
}
