import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StakingPeriodsTable } from "@/components/admin/StakingPeriodsTable";
import { StakingDealActions } from "@/components/admin/StakingDealActions";
import type { StakingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<StakingStatus, string> = {
  PROPOSED: "Propuesta",
  ACTIVE: "Activo",
  SETTLED: "Liquidado",
  CANCELLED: "Cancelado",
  DEFAULTED: "Default",
};

const STATUS_VARIANT: Record<
  StakingStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  PROPOSED: "warning",
  ACTIVE: "success",
  SETTLED: "secondary",
  CANCELLED: "outline",
  DEFAULTED: "destructive",
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export default async function AdminStakingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const deal = await prisma.stakingDeal.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      periods: { orderBy: { periodStart: "desc" } },
    },
  });
  if (!deal) notFound();

  const periods = deal.periods.map((p) => ({
    id: p.id,
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    profitLoss: p.profitLoss,
    makeupBefore: p.makeupBefore,
    makeupAfter: p.makeupAfter,
    mpdShare: p.mpdShare,
    playerShare: p.playerShare,
    notes: p.notes,
    createdAt: p.createdAt.toISOString(),
  }));

  const canAddPeriod = deal.status === "ACTIVE";
  const netPnL = deal.totalProfit - deal.totalLoss;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/staking">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-mpd-border bg-mpd-surface p-2.5">
            <Landmark className="h-5 w-5 text-mpd-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-mpd-white">
              {deal.user?.name ?? deal.user?.email ?? "—"}
            </h1>
            <p className="text-xs text-mpd-gray font-mono">{deal.user?.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={STATUS_VARIANT[deal.status]}>
                {STATUS_LABEL[deal.status]}
              </Badge>
              <span className="text-xs text-mpd-gray">
                Creado {format(deal.createdAt, "dd MMM yyyy", { locale: es })}
              </span>
            </div>
          </div>
        </div>
        <StakingDealActions
          id={deal.id}
          status={deal.status}
          userEmail={deal.user?.email ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-mpd-gray">
              Bankroll
            </p>
            <p className="text-lg font-mono text-mpd-white mt-1">
              {fmtMoney(deal.totalBankroll)}
            </p>
            <p className="text-[11px] text-mpd-gray mt-1">
              MPD {fmtMoney(deal.mpdContribution)} · Jugador{" "}
              {fmtMoney(deal.playerContribution)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-mpd-gray">
              Make-up actual
            </p>
            <p
              className={`text-lg font-mono mt-1 ${deal.currentMakeup > 0 ? "text-mpd-amber" : "text-mpd-green"}`}
            >
              {fmtMoney(deal.currentMakeup)}
            </p>
            <p className="text-[11px] text-mpd-gray mt-1">
              Split {deal.profitSplitMpd}/{deal.profitSplitPlayer}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-mpd-gray">
              P&L neto
            </p>
            <p
              className={`text-lg font-mono mt-1 ${netPnL >= 0 ? "text-mpd-green" : "text-mpd-amber"}`}
            >
              {fmtMoney(netPnL)}
            </p>
            <p className="text-[11px] text-mpd-gray mt-1">
              +{fmtMoney(deal.totalProfit)} / -{fmtMoney(deal.totalLoss)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-mpd-gray">
              Periodos
            </p>
            <p className="text-lg font-mono text-mpd-white mt-1">
              {periods.length}
            </p>
            <p className="text-[11px] text-mpd-gray mt-1">
              {deal.startDate
                ? `Inicio ${format(deal.startDate, "dd/MM/yy", { locale: es })}`
                : "Sin fecha de inicio"}
            </p>
          </CardContent>
        </Card>
      </div>

      {deal.notes && (
        <Card>
          <CardContent className="p-4">
            <p className="text-[11px] uppercase tracking-wide text-mpd-gray mb-1">
              Notas internas
            </p>
            <p className="text-sm text-mpd-white whitespace-pre-wrap">
              {deal.notes}
            </p>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-mpd-white uppercase tracking-wide">
            Historial de periodos
          </h2>
        </div>
        <StakingPeriodsTable
          dealId={deal.id}
          periods={periods}
          canAdd={canAddPeriod}
          currentMakeup={deal.currentMakeup}
          splitMpd={deal.profitSplitMpd}
          splitPlayer={deal.profitSplitPlayer}
        />
      </div>
    </div>
  );
}
