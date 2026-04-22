"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { X, MapPin, ExternalLink, ArrowUpRight } from "lucide-react";
import type { SerializedEvent } from "./CalendarPageClient";
import type { CalendarEventCategory } from "@prisma/client";

const CATEGORY_LABEL: Record<CalendarEventCategory, string> = {
  TORNEO: "Torneo",
  COMUNIDAD: "Comunidad",
  FORMACION: "Formación",
  PAGOS: "Pagos",
  MANTENIMIENTO: "Mantenimiento",
  GENERAL: "General",
};

export function EventDetailDialog({
  event,
  onOpenChange,
}: {
  event: SerializedEvent | null;
  onOpenChange: (open: boolean) => void;
}) {
  const open = !!event;
  const start = event ? new Date(event.startAt) : null;
  const end = event?.endAt ? new Date(event.endAt) : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-mpd-border bg-mpd-surface p-6 shadow-2xl focus:outline-none">
          {event && start && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Dialog.Title className="text-lg font-semibold text-mpd-white truncate">
                    {event.title}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-xs text-mpd-gray">
                    {CATEGORY_LABEL[event.category]}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    className="rounded p-1 text-mpd-gray hover:text-mpd-white"
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-mpd-gray">
                    Cuándo
                  </dt>
                  <dd className="text-mpd-white">
                    {format(start, "EEEE d 'de' LLLL, HH:mm", { locale: es })}
                    {end && ` — ${format(end, "HH:mm")}`}
                  </dd>
                </div>

                {event.location && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-mpd-gray">
                      Dónde
                    </dt>
                    <dd className="flex items-center gap-1.5 text-mpd-white">
                      <MapPin className="h-3.5 w-3.5 text-mpd-gray" />
                      {event.location}
                    </dd>
                  </div>
                )}

                {event.description && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-mpd-gray">
                      Detalles
                    </dt>
                    <dd className="text-mpd-white whitespace-pre-line">
                      {event.description}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-5 flex items-center gap-2">
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-mpd-border px-3 py-1.5 text-xs text-mpd-white hover:bg-mpd-black/30"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir enlace
                  </a>
                )}
                {event.refUrl && (
                  <Link
                    href={event.refUrl}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-mpd-gold/10 border border-mpd-gold/30 px-3 py-1.5 text-xs text-mpd-gold hover:bg-mpd-gold/20"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Ir al recurso
                  </Link>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
