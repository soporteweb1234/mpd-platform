"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Landmark,
  Check,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  acceptStakingDeal,
  rejectStakingDeal,
} from "@/lib/actions/staking";
import type { StakingStatus } from "@prisma/client";

type PlayerStakingPeriod = {
  id: string;
  periodStart: string;
  periodEnd: string;
  profitLoss: number;
  makeupAfter: number;
  mpdShare: number;
  playerShare: number;
  notes: string | null;
};

export type PlayerStakingDeal = {
  id: string;
  totalBankroll: number;
  mpdContribution: number;
  playerContribution: number;
  profitSplitMpd: number;
  profitSplitPlayer: number;
  status: StakingStatus;
  startDate: string | null;
  endDate: string | null;
  currentMakeup: number;
  totalProfit: number;
  totalLoss: number;
  notes: string | null;
  createdAt: string;
  periods: PlayerStakingPeriod[];
};

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

export function MyStakingDealsList({
  deals,
}: {
  deals: PlayerStakingDeal[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onAccept(id: string) {
    if (!confirm("¿Aceptar este deal de staking?")) return;
    setPendingId(id);
    try {
      const res = await acceptStakingDeal(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deal aceptado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  async function onReject(id: string) {
    const reason = prompt("Motivo (opcional)") ?? undefined;
    if (!confirm("¿Rechazar este deal?")) return;
    setPendingId(id);
    try {
      const res = await rejectStakingDeal(id, reason);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deal rechazado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {deals.map((d) => {
        const net = d.totalProfit - d.totalLoss;
        return (
          <Card key={d.id}>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-2">
                    <Landmark className="h-4 w-4 text-mpd-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={STATUS_VARIANT[d.status]}>
                        {STATUS_LABEL[d.status]}
                      </Badge>
                      <span className="text-xs text-mpd-gray">
                        Creado {format(new Date(d.createdAt), "dd MMM yyyy", { locale: es })}
                      </span>
                    </div>
                    {d.status === "PROPOSED" && (
                      <p className="text-xs text-mpd-amber mt-1">
                        Revisa las condiciones y acepta o rechaza.
                      </p>
                    )}
                  </div>
                </div>
                {d.status === "PROPOSED" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={pendingId === d.id}
                      onClick={() => onAccept(d.id)}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Aceptar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === d.id}
                      onClick={() => onReject(d.id)}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Rechazar
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatBox label="Bankroll" value={fmtMoney(d.totalBankroll)} />
                <StatBox
                  label="Aporte MPD"
                  value={fmtMoney(d.mpdContribution)}
                />
                <StatBox
                  label="Aporte jugador"
                  value={fmtMoney(d.playerContribution)}
                />
                <StatBox
                  label="Split"
                  value={`${d.profitSplitMpd}/${d.profitSplitPlayer}`}
                />
              </div>

              {(d.status === "ACTIVE" ||
                d.status === "SETTLED" ||
                d.status === "DEFAULTED") && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <StatBox
                    label="Make-up"
                    value={fmtMoney(d.currentMakeup)}
                    icon={
                      d.currentMakeup > 0 ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-mpd-amber" />
                      ) : null
                    }
                    valueClass={
                      d.currentMakeup > 0 ? "text-mpd-amber" : "text-mpd-green"
                    }
                  />
                  <StatBox
                    label="P&L neto"
                    value={fmtMoney(net)}
                    icon={
                      net >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-mpd-green" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-mpd-amber" />
                      )
                    }
                    valueClass={net >= 0 ? "text-mpd-green" : "text-mpd-amber"}
                  />
                  <StatBox
                    label="Periodos"
                    value={String(d.periods.length)}
                  />
                </div>
              )}

              {d.periods.length > 0 && (
                <div className="border-t border-mpd-border pt-3">
                  <p className="text-[11px] uppercase tracking-wide text-mpd-gray mb-2">
                    Últimos periodos
                  </p>
                  <div className="overflow-x-auto rounded-lg border border-mpd-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-mpd-border bg-mpd-black/40">
                          <th className="text-left py-1.5 px-2 text-[11px] text-mpd-gray font-medium">
                            Periodo
                          </th>
                          <th className="text-right py-1.5 px-2 text-[11px] text-mpd-gray font-medium">
                            P&L
                          </th>
                          <th className="text-right py-1.5 px-2 text-[11px] text-mpd-gray font-medium">
                            Make-up
                          </th>
                          <th className="text-right py-1.5 px-2 text-[11px] text-mpd-gray font-medium">
                            Tu parte
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.periods.slice(0, 6).map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-mpd-border/30"
                          >
                            <td className="py-1.5 px-2 text-[11px] text-mpd-white font-mono">
                              {format(new Date(p.periodStart), "dd/MM/yy", { locale: es })}
                              {" – "}
                              {format(new Date(p.periodEnd), "dd/MM/yy", { locale: es })}
                            </td>
                            <td
                              className={`py-1.5 px-2 text-right text-[11px] font-mono ${p.profitLoss >= 0 ? "text-mpd-green" : "text-mpd-amber"}`}
                            >
                              {fmtMoney(p.profitLoss)}
                            </td>
                            <td
                              className={`py-1.5 px-2 text-right text-[11px] font-mono ${p.makeupAfter > 0 ? "text-mpd-amber" : "text-mpd-gray"}`}
                            >
                              {fmtMoney(p.makeupAfter)}
                            </td>
                            <td className="py-1.5 px-2 text-right text-[11px] font-mono text-mpd-green">
                              {p.playerShare > 0
                                ? fmtMoney(p.playerShare)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatBox({
  label,
  value,
  valueClass,
  icon,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-3">
      <p className="text-[10px] uppercase tracking-wide text-mpd-gray">
        {label}
      </p>
      <p
        className={`text-sm font-mono mt-0.5 flex items-center gap-1.5 ${valueClass ?? "text-mpd-white"}`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}
