"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  upsertReferralCommission,
  type ReferralCommissionInput,
} from "@/lib/actions/admin-referrals";

type UserOption = { id: string; name: string; email: string };
type RoomOption = { id: string; name: string };

export function ReferralCommissionForm({
  referrerId,
  referredUsers,
  rooms,
  defaultReferredId,
  defaultRoomId,
  onDone,
}: {
  referrerId: string;
  referredUsers: UserOption[];
  rooms: RoomOption[];
  defaultReferredId?: string;
  defaultRoomId?: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<ReferralCommissionInput>({
    referrerId,
    referredId: defaultReferredId ?? referredUsers[0]?.id ?? "",
    roomId: defaultRoomId ?? rooms[0]?.id ?? "",
    commissionPercent: 50,
    periodStart: new Date().toISOString().slice(0, 10),
    periodEnd: null,
    active: true,
    notes: null,
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.referredId || !form.roomId) {
      toast.error("Selecciona referido y sala");
      return;
    }
    startTransition(async () => {
      const res = await upsertReferralCommission(form);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Comisión guardada");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-mpd-gold/40 bg-mpd-surface/50 p-4 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Referido</Label>
          <select
            value={form.referredId}
            onChange={(e) => setForm((f) => ({ ...f, referredId: e.target.value }))}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">— Seleccionar —</option>
            {referredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sala</Label>
          <select
            value={form.roomId}
            onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">— Seleccionar —</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Comisión (%)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={100}
            value={form.commissionPercent}
            onChange={(e) =>
              setForm((f) => ({ ...f, commissionPercent: Number(e.target.value) }))
            }
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input
            type="date"
            value={form.periodStart}
            onChange={(e) => setForm((f) => ({ ...f, periodStart: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta (opcional)</Label>
          <Input
            type="date"
            value={form.periodEnd ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, periodEnd: e.target.value || null }))
            }
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notas</Label>
        <Textarea
          rows={2}
          value={form.notes ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
          placeholder="Motivo del override, negociación, etc."
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-mpd-white">
        <input
          type="checkbox"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
        />
        Activa
      </label>

      <div className="flex items-center justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Cancelar
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar comisión"}
        </Button>
      </div>
    </form>
  );
}
