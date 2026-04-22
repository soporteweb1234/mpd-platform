"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateRoom, type UpdateRoomInput } from "@/lib/actions/admin";
import { Star } from "lucide-react";

type RoomStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type RoomData = UpdateRoomInput & { id: string };

export function RoomEditForm({ room }: { room: RoomData }) {
  const [form, setForm] = useState<RoomData>({ ...room });
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof RoomData>(key: K, value: RoomData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const { id, ...payload } = form;
      const res = await updateRoom(id, payload);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Sala actualizada");
    });
  };

  const rating = form.rating ?? 0;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre</Label>
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Código de afiliado</Label>
          <Input
            value={form.affiliateCode}
            onChange={(e) => set("affiliateCode", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Código de registro (para jugador)</Label>
          <Input
            value={form.registrationCode ?? ""}
            onChange={(e) => set("registrationCode", e.target.value || null)}
            placeholder="MPD2026 …"
          />
        </div>
        <div className="space-y-2">
          <Label>Master / gestor</Label>
          <Input
            value={form.master ?? ""}
            onChange={(e) => set("master", e.target.value || null)}
            placeholder="Nombre del manager responsable"
          />
        </div>
        <div className="space-y-2">
          <Label>Website</Label>
          <Input
            type="url"
            value={form.website ?? ""}
            onChange={(e) => set("website", e.target.value || null)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Logo (URL)</Label>
          <Input
            type="url"
            value={form.logo ?? ""}
            onChange={(e) => set("logo", e.target.value || null)}
            placeholder="https://…/logo.png"
          />
          <p className="text-[11px] text-mpd-gray">
            Solo URL manual en esta fase. Upload real queda para FASE 4.B.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Rakeback base (%)</Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            max={100}
            value={form.rakebackBase}
            onChange={(e) => set("rakebackBase", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Rakeback premium (%)</Label>
          <Input
            type="number"
            step="0.1"
            min={0}
            max={100}
            value={form.rakebackPremium ?? ""}
            onChange={(e) =>
              set("rakebackPremium", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Orden de listado</Label>
          <Input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Deal actual</Label>
          <Input
            type="number"
            min={0}
            value={form.dealCurrent ?? ""}
            onChange={(e) =>
              set("dealCurrent", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="Jugadores con deal actual"
          />
        </div>
        <div className="space-y-2">
          <Label>Deal máximo</Label>
          <Input
            type="number"
            min={0}
            value={form.dealMax ?? ""}
            onChange={(e) =>
              set("dealMax", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="Plazas totales del deal"
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select
            value={form.status ?? "ACTIVE"}
            onChange={(e) => set("status", e.target.value as RoomStatus)}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="ACTIVE">Activa</option>
            <option value="INACTIVE">Inactiva</option>
            <option value="SUSPENDED">Suspendida</option>
          </select>
        </div>
      </section>

      <section className="space-y-2">
        <Label>Valoración interna</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => set("rating", rating === n ? null : n)}
              className="p-1 hover:scale-110 transition-transform"
              aria-label={`Rating ${n}`}
            >
              <Star
                className={`h-6 w-6 ${
                  n <= rating
                    ? "fill-mpd-gold text-mpd-gold"
                    : "text-mpd-gray"
                }`}
              />
            </button>
          ))}
          {rating > 0 && (
            <button
              type="button"
              onClick={() => set("rating", null)}
              className="ml-2 text-xs text-mpd-gray hover:text-mpd-white"
            >
              Limpiar
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label>Descripción corta</Label>
          <Input
            value={form.shortDescription ?? ""}
            onChange={(e) => set("shortDescription", e.target.value || null)}
            placeholder="Frase de 1 línea para tarjetas de listado"
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label>Descripción larga</Label>
          <Textarea
            value={form.longDescription ?? ""}
            onChange={(e) => set("longDescription", e.target.value || null)}
            rows={4}
            placeholder="Detalles de la sala — tráfico, software, tipos de mesa…"
          />
        </div>
        <div className="space-y-2">
          <Label>Guía de registro (markdown permitido)</Label>
          <Textarea
            value={form.setupGuide ?? ""}
            onChange={(e) => set("setupGuide", e.target.value || null)}
            rows={4}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FlagToggle
          label="Requiere VPN"
          checked={!!form.vpnRequired}
          onChange={(v) => set("vpnRequired", v)}
        />
        <FlagToggle
          label="Requiere renting"
          checked={!!form.requiresRenting}
          onChange={(v) => set("requiresRenting", v)}
        />
        <FlagToggle
          label="Sin KYC"
          checked={!!form.noKyc}
          onChange={(v) => set("noKyc", v)}
        />
      </section>

      {form.vpnRequired && (
        <div className="space-y-2">
          <Label>Instrucciones de VPN</Label>
          <Textarea
            value={form.vpnInstructions ?? ""}
            onChange={(e) => set("vpnInstructions", e.target.value || null)}
            rows={3}
            placeholder="Servidor recomendado, protocolo, país…"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-mpd-border">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function FlagToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
      />
      <span className="text-sm text-mpd-white">{label}</span>
    </label>
  );
}
