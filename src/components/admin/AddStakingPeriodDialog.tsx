"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addStakingPeriod } from "@/lib/actions/admin-staking";
import { computeSettlement } from "@/lib/staking/settle";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

function todayLocal(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AddStakingPeriodDialog({
  dealId,
  currentMakeup,
  splitMpd,
  splitPlayer,
  onClose,
}: {
  dealId: string;
  currentMakeup: number;
  splitMpd: number;
  splitPlayer: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [periodStart, setPeriodStart] = React.useState(todayLocal());
  const [periodEnd, setPeriodEnd] = React.useState(todayLocal());
  const [profitLoss, setProfitLoss] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const preview = React.useMemo(
    () =>
      computeSettlement({
        profitLoss,
        makeupBefore: currentMakeup,
        profitSplitMpd: splitMpd,
        profitSplitPlayer: splitPlayer,
      }),
    [profitLoss, currentMakeup, splitMpd, splitPlayer],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!periodStart || !periodEnd) {
      toast.error("Fechas requeridas");
      return;
    }
    if (new Date(periodEnd).getTime() < new Date(periodStart).getTime()) {
      toast.error("Fin debe ser posterior al inicio");
      return;
    }

    setPending(true);
    try {
      const res = await addStakingPeriod({
        dealId,
        periodStart: new Date(periodStart).toISOString(),
        periodEnd: new Date(periodEnd).toISOString(),
        profitLoss,
        notes: notes.trim(),
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Periodo añadido");
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-mpd-border bg-mpd-surface shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-mpd-border p-4">
          <h3 className="text-base font-semibold text-mpd-white">
            Añadir periodo
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Inicio *</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin *</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Profit / Loss del periodo *{" "}
              <span className="text-mpd-gray">
                (positivo = ganancia, negativo = pérdida)
              </span>
            </Label>
            <Input
              type="number"
              step="0.01"
              value={profitLoss}
              onChange={(e) => setProfitLoss(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-3 space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-mpd-gray">
              Previsualización del settlement
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-mpd-gray">Make-up antes</p>
                <p className="font-mono text-mpd-white">
                  {fmtMoney(currentMakeup)}
                </p>
              </div>
              <div>
                <p className="text-mpd-gray">Make-up después</p>
                <p
                  className={`font-mono ${preview.makeupAfter > 0 ? "text-mpd-amber" : "text-mpd-green"}`}
                >
                  {fmtMoney(preview.makeupAfter)}
                </p>
              </div>
              <div>
                <p className="text-mpd-gray">Split</p>
                <p className="font-mono text-mpd-white">
                  {splitMpd}/{splitPlayer}
                </p>
              </div>
              <div>
                <p className="text-mpd-gray">MPD recibe</p>
                <p className="font-mono text-mpd-gold">
                  {fmtMoney(preview.mpdShare)}
                </p>
              </div>
              <div>
                <p className="text-mpd-gray">Jugador recibe</p>
                <p className="font-mono text-mpd-green">
                  {fmtMoney(preview.playerShare)}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notas (opcional)</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
              placeholder="Contexto del periodo, salas, variance..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-mpd-border pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : "Añadir periodo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
