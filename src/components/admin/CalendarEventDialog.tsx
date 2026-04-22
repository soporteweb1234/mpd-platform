"use client";

import * as React from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCalendarEvent,
  updateCalendarEvent,
} from "@/lib/actions/admin-calendar";
import type {
  CalendarEventCategory,
  CalendarEventVisibility,
} from "@prisma/client";
import type { AdminCalendarEvent } from "./CalendarEventsTable";

const CATEGORIES: CalendarEventCategory[] = [
  "GENERAL",
  "TORNEO",
  "COMUNIDAD",
  "FORMACION",
  "PAGOS",
  "MANTENIMIENTO",
];

const VISIBILITIES: CalendarEventVisibility[] = [
  "PUBLIC",
  "STRATUM_ONLY",
  "ADMIN_ONLY",
];

const CATEGORY_LABEL: Record<CalendarEventCategory, string> = {
  GENERAL: "General",
  TORNEO: "Torneo",
  COMUNIDAD: "Comunidad",
  MANTENIMIENTO: "Mantenimiento",
  FORMACION: "Formación",
  PAGOS: "Pagos",
};

const VISIBILITY_LABEL: Record<CalendarEventVisibility, string> = {
  PUBLIC: "Público (todos los jugadores)",
  STRATUM_ONLY: "Por estrato (tratado como admin por ahora)",
  ADMIN_ONLY: "Solo admin",
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CalendarEventDialog({
  mode,
  event,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  event?: AdminCalendarEvent;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = React.useState(event?.title ?? "");
  const [description, setDescription] = React.useState(event?.description ?? "");
  const [startAt, setStartAt] = React.useState(
    toLocalInput(event?.startAt ?? new Date().toISOString()),
  );
  const [endAt, setEndAt] = React.useState(toLocalInput(event?.endAt ?? null));
  const [category, setCategory] = React.useState<CalendarEventCategory>(
    event?.category ?? "GENERAL",
  );
  const [visibility, setVisibility] = React.useState<CalendarEventVisibility>(
    event?.visibility ?? "PUBLIC",
  );
  const [color, setColor] = React.useState(event?.color ?? "");
  const [location, setLocation] = React.useState(event?.location ?? "");
  const [url, setUrl] = React.useState(event?.url ?? "");
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (title.trim().length < 3) {
      toast.error("El título debe tener al menos 3 caracteres");
      return;
    }
    if (!startAt) {
      toast.error("La fecha de inicio es obligatoria");
      return;
    }
    setPending(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        startAt: new Date(startAt).toISOString(),
        endAt: endAt ? new Date(endAt).toISOString() : "",
        category,
        visibility,
        color: color.trim(),
        location: location.trim(),
        url: url.trim(),
      };
      const res =
        mode === "create"
          ? await createCalendarEvent(payload)
          : await updateCalendarEvent(event!.id, payload);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Evento creado" : "Evento actualizado");
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
            {mode === "create" ? "Nuevo evento" : "Editar evento"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Descripción</Label>
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Inicio *</Label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fin (opcional)</Label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Categoría</Label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CalendarEventCategory)
                }
                className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Visibilidad</Label>
              <select
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as CalendarEventVisibility)
                }
                className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {VISIBILITY_LABEL[v]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ubicación</Label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={200}
                placeholder="Discord, PokerStars, ..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Color (hex #RRGGBB, opcional)</Label>
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                maxLength={7}
                placeholder="#C9A84C"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">URL externa (opcional)</Label>
            <Input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
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
                  ? "Crear evento"
                  : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
