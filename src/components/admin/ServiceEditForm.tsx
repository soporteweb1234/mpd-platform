"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateService, type UpdateServiceInput } from "@/lib/actions/admin";
import { Lock, Eye, EyeOff } from "lucide-react";

type ServiceData = UpdateServiceInput & { id: string };

const CATEGORIES = ["VPN", "DATAMINING", "TOOLS", "COACHING", "OTHER"];
const STATUSES: Array<UpdateServiceInput["status"]> = [
  "AVAILABLE",
  "COMING_SOON",
  "DISCONTINUED",
];
const STRATA = ["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"] as const;

export function ServiceEditForm({ service }: { service: ServiceData }) {
  const [form, setForm] = useState<ServiceData>({ ...service });
  const [featuresText, setFeaturesText] = useState(
    (service.features ?? []).join("\n"),
  );
  const [isPending, startTransition] = useTransition();

  const set = <K extends keyof ServiceData>(key: K, value: ServiceData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const features = featuresText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const { id, ...payload } = { ...form, features };
      const res = await updateService(id, payload);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Servicio actualizado");
    });
  };

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
          <Label>Categoría</Label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Icono (emoji o nombre)</Label>
          <Input
            value={form.icon ?? ""}
            onChange={(e) => set("icon", e.target.value || null)}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Precio €</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={form.priceEur}
            onChange={(e) => set("priceEur", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Precio en saldo</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={form.priceInBalance ?? ""}
            onChange={(e) =>
              set("priceInBalance", e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Orden</Label>
          <Input
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Estado</Label>
          <select
            value={form.status ?? "AVAILABLE"}
            onChange={(e) => set("status", e.target.value as UpdateServiceInput["status"])}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Estrato mínimo requerido</Label>
          <select
            value={form.requiredStratum ?? ""}
            onChange={(e) =>
              set("requiredStratum", (e.target.value || null) as UpdateServiceInput["requiredStratum"])
            }
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">Sin restricción</option>
            {STRATA.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Recurrente</Label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.isRecurring}
              onChange={(e) => set("isRecurring", e.target.checked)}
              className="h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
            />
            <Input
              placeholder="Período (ej: mensual)"
              value={form.recurringPeriod ?? ""}
              onChange={(e) => set("recurringPeriod", e.target.value || null)}
              disabled={!form.isRecurring}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <Label>Descripción corta</Label>
          <Input
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Descripción completa</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Features (una por línea)</Label>
          <Textarea
            value={featuresText}
            onChange={(e) => setFeaturesText(e.target.value)}
            rows={4}
            placeholder="IPs residenciales&#10;Multi-dispositivo&#10;Soporte 24/7"
          />
        </div>
        <div className="space-y-2">
          <Label>Instrucciones de setup</Label>
          <Textarea
            value={form.setupInstructions ?? ""}
            onChange={(e) => set("setupInstructions", e.target.value || null)}
            rows={3}
          />
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-mpd-border bg-mpd-surface p-4">
        <h3 className="text-sm font-medium text-mpd-white">Visibilidad lado usuario</h3>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!form.priceVisible}
            onChange={(e) => set("priceVisible", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
          />
          <div>
            <div className="flex items-center gap-2 text-sm text-mpd-white">
              {form.priceVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Precio público
            </div>
            <p className="text-xs text-mpd-gray">
              Si se desactiva, el precio se oculta en la card del jugador.
            </p>
          </div>
        </label>

        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!form.locked}
            onChange={(e) => set("locked", e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 text-sm text-mpd-white">
              <Lock className="h-4 w-4" />
              Servicio bloqueado (candado)
            </div>
            <p className="text-xs text-mpd-gray mb-2">
              Si se activa, el servicio aparece sombreado excepto para usuarios en whitelist.
            </p>
            <Input
              placeholder='Etiqueta del candado (ej: "Agotado", "Sin permisos")'
              value={form.lockedLabel ?? ""}
              onChange={(e) => set("lockedLabel", e.target.value || null)}
              disabled={!form.locked}
            />
          </div>
        </label>
      </section>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-mpd-border">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
