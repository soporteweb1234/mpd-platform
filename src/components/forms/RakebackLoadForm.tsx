"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { loadRakeback } from "@/lib/actions/admin";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface Props {
  users: { id: string; name: string; email: string; availableBalance: number }[];
  rooms: { id: string; name: string; rakebackBase: number }[];
}

type PendingPayload = {
  userId: string;
  userLabel: string;
  balanceBefore: number;
  roomId: string;
  roomLabel: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  rakeGenerated: number;
  rakebackPercent: number;
  notes?: string;
};

export function RakebackLoadForm({ users, rooms }: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rakebackPercent, setRakebackPercent] = useState(0);
  const [pending, setPending] = useState<PendingPayload | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) setRakebackPercent(room.rakebackBase);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const userId = fd.get("userId") as string;
    const roomId = fd.get("roomId") as string;
    const user = users.find((u) => u.id === userId);
    const room = rooms.find((r) => r.id === roomId);
    setPending({
      userId,
      userLabel: user ? `${user.name} (${user.email})` : userId,
      balanceBefore: user?.availableBalance ?? 0,
      roomId,
      roomLabel: room ? room.name : roomId,
      period: fd.get("period") as string,
      periodStart: fd.get("periodStart") as string,
      periodEnd: fd.get("periodEnd") as string,
      rakeGenerated: Number(fd.get("rakeGenerated")),
      rakebackPercent: Number(fd.get("rakebackPercent")),
      notes: (fd.get("notes") as string) || undefined,
    });
  };

  const commit = async () => {
    if (!pending) return;
    setLoading(true);
    const result = await loadRakeback({
      userId: pending.userId,
      roomId: pending.roomId,
      period: pending.period,
      periodStart: pending.periodStart,
      periodEnd: pending.periodEnd,
      rakeGenerated: pending.rakeGenerated,
      rakebackPercent: pending.rakebackPercent,
      notes: pending.notes,
    });

    if (result && "error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Rakeback cargado correctamente");
      formRef.current?.reset();
      setSelectedRoom("");
      setRakebackPercent(0);
    }
    setLoading(false);
    setPending(null);
  };

  const expectedAmount = pending
    ? (pending.rakeGenerated * pending.rakebackPercent) / 100
    : 0;

  return (
    <>
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">Jugador</Label>
        <select
          name="userId"
          id="userId"
          required
          className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
        >
          <option value="">Seleccionar jugador...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="roomId">Sala</Label>
        <select
          name="roomId"
          id="roomId"
          required
          value={selectedRoom}
          onChange={(e) => handleRoomChange(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
        >
          <option value="">Seleccionar sala...</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name} ({r.rakebackBase}%)</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="period">Período</Label>
          <Input name="period" id="period" placeholder="2026-03-01" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rakeGenerated">Rake Generado (€)</Label>
          <Input name="rakeGenerated" id="rakeGenerated" type="number" step="0.01" min="0" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="periodStart">Inicio Período</Label>
          <Input name="periodStart" id="periodStart" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="periodEnd">Fin Período</Label>
          <Input name="periodEnd" id="periodEnd" type="date" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rakebackPercent">% Rakeback</Label>
        <Input
          name="rakebackPercent"
          id="rakebackPercent"
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={rakebackPercent}
          onChange={(e) => setRakebackPercent(Number(e.target.value))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Textarea name="notes" id="notes" rows={2} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Cargando..." : "Cargar Rakeback"}
      </Button>
    </form>

    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(o) => !o && !loading && setPending(null)}
      title="Confirmar carga de rakeback"
      loading={loading}
      description={
        pending ? (
          <div className="space-y-3">
            <p>
              Se acreditará rakeback a{" "}
              <span className="text-mpd-white">{pending.userLabel}</span>.
            </p>
            <ul className="text-xs font-mono text-mpd-white/80 bg-mpd-black/40 rounded p-2 space-y-0.5">
              <li>Sala: {pending.roomLabel}</li>
              <li>Período: {pending.period}</li>
              <li>Rake generado: €{pending.rakeGenerated.toFixed(2)}</li>
              <li>% Rakeback: {pending.rakebackPercent}%</li>
              <li>
                Crédito: <span className="text-mpd-gold">€{expectedAmount.toFixed(2)}</span>
              </li>
            </ul>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-mpd-black/40 rounded p-2">
                <p className="text-mpd-gray text-[10px] uppercase tracking-wider">Saldo antes</p>
                <p className="text-mpd-white">€{pending.balanceBefore.toFixed(2)}</p>
              </div>
              <div className="bg-mpd-green/10 border border-mpd-green/30 rounded p-2">
                <p className="text-mpd-gray text-[10px] uppercase tracking-wider">Saldo después</p>
                <p className="text-mpd-green">€{(pending.balanceBefore + expectedAmount).toFixed(2)}</p>
              </div>
            </div>
          </div>
        ) : null
      }
      confirmLabel="Confirmar carga"
      onConfirm={commit}
    />
    </>
  );
}
