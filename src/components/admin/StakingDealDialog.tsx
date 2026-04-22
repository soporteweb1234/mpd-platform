"use client";

import * as React from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createStakingDeal,
  updateStakingDeal,
} from "@/lib/actions/admin-staking";
import type { AdminStakingDeal, UserOption } from "./StakingDealsTable";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function StakingDealDialog({
  mode,
  deal,
  users,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  deal?: AdminStakingDeal;
  users: UserOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [userId, setUserId] = React.useState(deal?.userId ?? "");
  const [totalBankroll, setTotalBankroll] = React.useState(
    deal?.totalBankroll ?? 0,
  );
  const [mpdContribution, setMpdContribution] = React.useState(
    deal?.mpdContribution ?? 0,
  );
  const [playerContribution, setPlayerContribution] = React.useState(
    deal?.playerContribution ?? 0,
  );
  const [splitMpd, setSplitMpd] = React.useState(deal?.profitSplitMpd ?? 35);
  const [splitPlayer, setSplitPlayer] = React.useState(
    deal?.profitSplitPlayer ?? 65,
  );
  const [startDate, setStartDate] = React.useState(
    toLocalInput(deal?.startDate ?? null),
  );
  const [endDate, setEndDate] = React.useState(
    toLocalInput(deal?.endDate ?? null),
  );
  const [notes, setNotes] = React.useState(deal?.notes ?? "");
  const [pending, setPending] = React.useState(false);

  const contribTotal = mpdContribution + playerContribution;
  const contribMismatch = Math.abs(contribTotal - totalBankroll) > 0.01;
  const splitSum = splitMpd + splitPlayer;
  const splitMismatch = Math.abs(splitSum - 100) > 0.01;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (mode === "create" && !userId) {
      toast.error("Selecciona un jugador");
      return;
    }
    if (totalBankroll <= 0) {
      toast.error("Bankroll debe ser > 0");
      return;
    }
    if (contribMismatch) {
      toast.error("Las contribuciones deben sumar el bankroll total");
      return;
    }
    if (splitMismatch) {
      toast.error("El split debe sumar 100");
      return;
    }

    setPending(true);
    try {
      const payload = {
        userId,
        totalBankroll,
        mpdContribution,
        playerContribution,
        profitSplitMpd: splitMpd,
        profitSplitPlayer: splitPlayer,
        startDate: startDate ? new Date(startDate).toISOString() : "",
        endDate: endDate ? new Date(endDate).toISOString() : "",
        notes: notes.trim(),
      };
      const res =
        mode === "create"
          ? await createStakingDeal(payload)
          : await updateStakingDeal(deal!.id, payload);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Deal creado" : "Deal actualizado");
      onSaved();
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
        className="w-full max-w-2xl rounded-xl border border-mpd-border bg-mpd-surface shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-mpd-border p-4">
          <h3 className="text-base font-semibold text-mpd-white">
            {mode === "create" ? "Nuevo deal de staking" : "Editar deal"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Jugador *</Label>
            {mode === "create" ? (
              <select
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
                required
              >
                <option value="">— Selecciona jugador —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ? `${u.name} (${u.email})` : u.email}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-mpd-white font-mono">
                {deal?.user?.name ?? deal?.user?.email}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Bankroll total *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={totalBankroll}
                onChange={(e) => setTotalBankroll(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aporte MPD *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={mpdContribution}
                onChange={(e) =>
                  setMpdContribution(parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Aporte jugador *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={playerContribution}
                onChange={(e) =>
                  setPlayerContribution(parseFloat(e.target.value) || 0)
                }
                required
              />
            </div>
          </div>
          {contribMismatch && (
            <p className="text-xs text-mpd-amber">
              Aportes suman {contribTotal.toFixed(2)} — debe coincidir con bankroll {totalBankroll.toFixed(2)}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">% MPD (del profit residual)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={splitMpd}
                onChange={(e) => setSplitMpd(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">% Jugador</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={splitPlayer}
                onChange={(e) => setSplitPlayer(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          {splitMismatch && (
            <p className="text-xs text-mpd-amber">
              Split suma {splitSum.toFixed(1)} — debe ser 100
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Inicio previsto (opcional)</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin previsto (opcional)</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Notas internas</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 2000))}
              placeholder="Contexto, condiciones especiales, acuerdos verbales..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-mpd-border pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending
                ? "Guardando…"
                : mode === "create"
                  ? "Crear deal"
                  : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
