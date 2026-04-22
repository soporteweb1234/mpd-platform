"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { loadRakeback } from "@/lib/actions/admin";

function defaultPeriod(): { period: string; start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const half = day <= 15 ? 1 : 2;
  const start = new Date(year, month, half === 1 ? 1 : 16);
  const end =
    half === 1
      ? new Date(year, month, 15)
      : new Date(year, month + 1, 0);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const toIso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  return {
    period: `${year}-${pad(month + 1)}-Q${half}`,
    start: toIso(start),
    end: toIso(end),
  };
}

export function LoadRakebackForm({
  userId,
  rooms,
}: {
  userId: string;
  rooms: Array<{ id: string; name: string; slug: string }>;
}) {
  const router = useRouter();
  const pd = defaultPeriod();
  const [roomId, setRoomId] = React.useState(rooms[0]?.id ?? "");
  const [period, setPeriod] = React.useState(pd.period);
  const [periodStart, setPeriodStart] = React.useState(pd.start);
  const [periodEnd, setPeriodEnd] = React.useState(pd.end);
  const [rakeGenerated, setRakeGenerated] = React.useState(0);
  const [rakebackPercent, setRakebackPercent] = React.useState(30);
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const rakebackAmount = (rakeGenerated * rakebackPercent) / 100;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!roomId) {
      toast.error("Selecciona una sala");
      return;
    }
    if (rakeGenerated <= 0) {
      toast.error("Rake generado debe ser > 0");
      return;
    }
    setPending(true);
    try {
      const res = await loadRakeback({
        userId,
        roomId,
        period,
        periodStart,
        periodEnd,
        rakeGenerated,
        rakebackPercent,
        notes: notes.trim() || undefined,
      });
      if ("error" in res) {
        toast.error(res.error as string);
        return;
      }
      toast.success(`Rakeback acreditado: $${rakebackAmount.toFixed(2)}`);
      router.push(`/admin/users/${userId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label className="text-xs">Sala *</Label>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          required
        >
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Período *</Label>
          <Input value={period} onChange={(e) => setPeriod(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Desde *</Label>
          <Input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta *</Label>
          <Input
            type="date"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Rake generado (EUR) *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={rakeGenerated}
            onChange={(e) => setRakeGenerated(parseFloat(e.target.value) || 0)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rakeback % *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={rakebackPercent}
            onChange={(e) => setRakebackPercent(parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>
      <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-3">
        <p className="text-[11px] uppercase tracking-wide text-mpd-gray mb-1">
          A acreditar
        </p>
        <p className="text-xl font-mono text-mpd-green">
          ${rakebackAmount.toFixed(2)}
        </p>
        <p className="text-[10px] text-mpd-gray mt-1">
          Las comisiones a referrers (L1/L2) se crean automáticamente en pending.
        </p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Notas (opcional)</Label>
        <Textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 500))}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Acreditando..." : "Acreditar rakeback"}
        </Button>
      </div>
    </form>
  );
}
