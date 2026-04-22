"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarEventDialog } from "./CalendarEventDialog";
import { deleteCalendarEvent } from "@/lib/actions/admin-calendar";
import type {
  CalendarEventCategory,
  CalendarEventVisibility,
} from "@prisma/client";

export type AdminCalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  category: CalendarEventCategory;
  visibility: CalendarEventVisibility;
  color: string | null;
  location: string | null;
  url: string | null;
  creator: { id: string; name: string | null; email: string } | null;
};

const CATEGORY_LABEL: Record<CalendarEventCategory, string> = {
  GENERAL: "General",
  TORNEO: "Torneo",
  COMUNIDAD: "Comunidad",
  MANTENIMIENTO: "Mantenimiento",
  FORMACION: "Formación",
  PAGOS: "Pagos",
};

const VISIBILITY_LABEL: Record<CalendarEventVisibility, string> = {
  PUBLIC: "Público",
  STRATUM_ONLY: "Por estrato",
  ADMIN_ONLY: "Solo admin",
};

const CATEGORY_VARIANT: Record<
  CalendarEventCategory,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  GENERAL: "secondary",
  TORNEO: "warning",
  COMUNIDAD: "success",
  MANTENIMIENTO: "outline",
  FORMACION: "default",
  PAGOS: "secondary",
};

export function CalendarEventsTable({ events }: { events: AdminCalendarEvent[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminCalendarEvent | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = React.useState<"" | CalendarEventCategory>("");
  const [visibilityFilter, setVisibilityFilter] = React.useState<"" | CalendarEventVisibility>("");

  const filtered = events.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (visibilityFilter && e.visibility !== visibilityFilter) return false;
    return true;
  });

  async function onDelete(id: string, title: string) {
    if (!confirm(`¿Borrar "${title}"?`)) return;
    setPendingId(id);
    try {
      const res = await deleteCalendarEvent(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Evento eliminado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as "" | CalendarEventCategory)
            }
            className="h-9 rounded-lg border border-mpd-border bg-mpd-surface px-2 text-xs text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={visibilityFilter}
            onChange={(e) =>
              setVisibilityFilter(e.target.value as "" | CalendarEventVisibility)
            }
            className="h-9 rounded-lg border border-mpd-border bg-mpd-surface px-2 text-xs text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">Toda visibilidad</option>
            {Object.entries(VISIBILITY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span className="text-xs text-mpd-gray">
            {filtered.length} / {events.length}
          </span>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo evento
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/40">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Título</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Categoría</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Visibilidad</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Inicio</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Fin</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Creador</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const start = new Date(e.startAt);
              const end = e.endAt ? new Date(e.endAt) : null;
              return (
                <tr key={e.id} className="border-b border-mpd-border/30">
                  <td className="py-2 px-3">
                    <p className="text-mpd-white font-medium">{e.title}</p>
                    {e.location && (
                      <p className="text-[11px] text-mpd-gray">{e.location}</p>
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant={CATEGORY_VARIANT[e.category]} className="text-[10px]">
                      {CATEGORY_LABEL[e.category]}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-center text-[11px] text-mpd-gray">
                    {VISIBILITY_LABEL[e.visibility]}
                  </td>
                  <td className="py-2 px-3 text-xs text-mpd-white font-mono">
                    {format(start, "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="py-2 px-3 text-xs text-mpd-gray font-mono">
                    {end ? format(end, "dd/MM/yyyy HH:mm", { locale: es }) : "—"}
                  </td>
                  <td className="py-2 px-3 text-xs text-mpd-gray">
                    {e.creator?.name ?? e.creator?.email ?? "—"}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(e)}
                        aria-label="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(e.id, e.title)}
                        disabled={pendingId === e.id}
                        aria-label="Borrar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 px-3 text-center text-xs text-mpd-gray">
                  Sin resultados con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <CalendarEventDialog
          mode="create"
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <CalendarEventDialog
          mode="edit"
          event={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
