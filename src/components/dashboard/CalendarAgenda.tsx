"use client";

import * as React from "react";
import { format, isAfter, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import type { SerializedEvent } from "./CalendarPageClient";
import type { CalendarEventCategory } from "@prisma/client";

const CATEGORY_DOT: Record<CalendarEventCategory, string> = {
  TORNEO: "bg-mpd-gold",
  COMUNIDAD: "bg-mpd-green",
  FORMACION: "bg-mpd-amber",
  PAGOS: "bg-mpd-white",
  MANTENIMIENTO: "bg-mpd-gray",
  GENERAL: "bg-mpd-border",
};

export function CalendarAgenda({
  events,
  onSelectEvent,
}: {
  events: SerializedEvent[];
  onSelectEvent: (e: SerializedEvent) => void;
}) {
  const now = new Date();
  const horizon = addDays(now, 30);

  const upcoming = events
    .map((e) => ({ ...e, _date: new Date(e.startAt) }))
    .filter((e) => isAfter(e._date, now) || isSameDay(e._date, now))
    .filter((e) => !isAfter(e._date, horizon))
    .sort((a, b) => a._date.getTime() - b._date.getTime());

  if (upcoming.length === 0) {
    return (
      <div className="rounded-xl border border-mpd-border bg-mpd-surface p-8 text-center">
        <CalendarIcon className="mx-auto h-8 w-8 text-mpd-gray" />
        <p className="mt-3 text-sm text-mpd-gray">
          Sin eventos en los próximos 30 días.
        </p>
      </div>
    );
  }

  const grouped = new Map<string, typeof upcoming>();
  for (const e of upcoming) {
    const key = format(e._date, "yyyy-MM-dd");
    const arr = grouped.get(key) ?? [];
    arr.push(e);
    grouped.set(key, arr);
  }

  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([key, dayEvents]) => {
        const date = new Date(key);
        return (
          <section
            key={key}
            className="rounded-xl border border-mpd-border bg-mpd-surface overflow-hidden"
          >
            <div className="px-4 py-2 border-b border-mpd-border flex items-baseline justify-between">
              <h3 className="font-display text-sm uppercase tracking-wider text-mpd-white">
                {format(date, "EEEE d 'de' LLLL", { locale: es })}
              </h3>
              <span className="text-xs text-mpd-gray">
                {dayEvents.length} evento{dayEvents.length === 1 ? "" : "s"}
              </span>
            </div>
            <ul className="divide-y divide-mpd-border">
              {dayEvents.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => onSelectEvent(e)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-mpd-black/30 transition-colors"
                  >
                    <span
                      className={
                        "h-2 w-2 shrink-0 rounded-full " +
                        CATEGORY_DOT[e.category]
                      }
                      aria-hidden
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-sm text-mpd-white">
                        {e.title}
                      </span>
                      {e.description && (
                        <span className="block truncate text-xs text-mpd-gray">
                          {e.description}
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-[11px] text-mpd-gray shrink-0">
                      {format(e._date, "HH:mm")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
