"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { loadRakeback } from "@/lib/actions/admin";

interface Props {
  users: { id: string; name: string; email: string }[];
  rooms: { id: string; name: string; rakebackBase: number }[];
}

export function RakebackLoadForm({ users, rooms }: Props) {
  const [loading, setLoading] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [rakebackPercent, setRakebackPercent] = useState(0);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
    const room = rooms.find((r) => r.id === roomId);
    if (room) setRakebackPercent(room.rakebackBase);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await loadRakeback({
      userId: fd.get("userId") as string,
      roomId: fd.get("roomId") as string,
      period: fd.get("period") as string,
      periodStart: fd.get("periodStart") as string,
      periodEnd: fd.get("periodEnd") as string,
      rakeGenerated: Number(fd.get("rakeGenerated")),
      rakebackPercent: Number(fd.get("rakebackPercent")),
      notes: (fd.get("notes") as string) || undefined,
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Rakeback cargado correctamente");
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
  );
}
