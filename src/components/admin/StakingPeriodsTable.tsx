"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddStakingPeriodDialog } from "./AddStakingPeriodDialog";

export type StakingPeriodRow = {
  id: string;
  periodStart: string;
  periodEnd: string;
  profitLoss: number;
  makeupBefore: number;
  makeupAfter: number;
  mpdShare: number;
  playerShare: number;
  notes: string | null;
  createdAt: string;
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function StakingPeriodsTable({
  dealId,
  periods,
  canAdd,
  currentMakeup,
  splitMpd,
  splitPlayer,
}: {
  dealId: string;
  periods: StakingPeriodRow[];
  canAdd: boolean;
  currentMakeup: number;
  splitMpd: number;
  splitPlayer: number;
}) {
  const [adding, setAdding] = React.useState(false);

  return (
    <>
      <div className="flex items-center justify-end mb-2">
        {canAdd && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Añadir periodo
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/40">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">
                Periodo
              </th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                P&L
              </th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                Make-up antes
              </th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                Make-up después
              </th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                MPD
              </th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                Jugador
              </th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">
                Notas
              </th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id} className="border-b border-mpd-border/30">
                <td className="py-2 px-3 text-xs text-mpd-white font-mono">
                  {format(new Date(p.periodStart), "dd/MM/yy", { locale: es })}
                  {" – "}
                  {format(new Date(p.periodEnd), "dd/MM/yy", { locale: es })}
                </td>
                <td
                  className={`py-2 px-3 text-right font-mono ${p.profitLoss >= 0 ? "text-mpd-green" : "text-mpd-amber"}`}
                >
                  {fmtMoney(p.profitLoss)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-gray">
                  {fmtMoney(p.makeupBefore)}
                </td>
                <td
                  className={`py-2 px-3 text-right font-mono ${p.makeupAfter > 0 ? "text-mpd-amber" : "text-mpd-gray"}`}
                >
                  {fmtMoney(p.makeupAfter)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-gold">
                  {p.mpdShare > 0 ? fmtMoney(p.mpdShare) : "—"}
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-green">
                  {p.playerShare > 0 ? fmtMoney(p.playerShare) : "—"}
                </td>
                <td className="py-2 px-3 text-xs text-mpd-gray max-w-[220px] truncate">
                  {p.notes ?? "—"}
                </td>
              </tr>
            ))}
            {periods.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 px-3 text-center text-xs text-mpd-gray"
                >
                  Aún no hay periodos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {adding && (
        <AddStakingPeriodDialog
          dealId={dealId}
          currentMakeup={currentMakeup}
          splitMpd={splitMpd}
          splitPlayer={splitPlayer}
          onClose={() => setAdding(false)}
        />
      )}
    </>
  );
}
