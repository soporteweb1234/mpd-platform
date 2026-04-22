"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth } from "date-fns";
import { es } from "date-fns/locale";
import type { SerializedEvent } from "./CalendarPageClient";
import type { CalendarEventCategory } from "@prisma/client";

const CATEGORY_COLORS: Record<CalendarEventCategory, string> = {
  TORNEO: "bg-mpd-gold/15 text-mpd-gold border-mpd-gold/30",
  COMUNIDAD: "bg-mpd-green/15 text-mpd-green border-mpd-green/30",
  FORMACION: "bg-mpd-amber/15 text-mpd-amber border-mpd-amber/30",
  PAGOS: "bg-mpd-white/10 text-mpd-white border-mpd-border",
  MANTENIMIENTO: "bg-mpd-gray/15 text-mpd-gray border-mpd-border",
  GENERAL: "bg-mpd-surface text-mpd-gray border-mpd-border",
};

const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function parseDate(iso: string): Date {
  return new Date(iso);
}

export function CalendarView({
  events,
  onSelectEvent,
}: {
  events: SerializedEvent[];
  onSelectEvent: (e: SerializedEvent) => void;
}) {
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()));

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const eventsByDay = React.useMemo(() => {
    const map = new Map<string, SerializedEvent[]>();
    for (const e of events) {
      const key = format(parseDate(e.startAt), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  return (
    <section className="rounded-xl border border-mpd-border bg-mpd-surface">
      <header className="flex items-center justify-between px-4 py-3 border-b border-mpd-border">
        <h2 className="font-display text-base uppercase tracking-wider text-mpd-white">
          {format(cursor, "LLLL yyyy", { locale: es })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCursor((c) => addMonths(c, -1))}
            className="rounded p-1 text-mpd-gray hover:text-mpd-white hover:bg-mpd-black/50"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCursor(startOfMonth(new Date()))}
            className="rounded px-2 py-1 text-xs text-mpd-gray hover:text-mpd-white hover:bg-mpd-black/50"
          >
            Hoy
          </button>
          <button
            onClick={() => setCursor((c) => addMonths(c, 1))}
            className="rounded p-1 text-mpd-gray hover:text-mpd-white hover:bg-mpd-black/50"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-7 border-b border-mpd-border text-center text-[11px] uppercase tracking-wider text-mpd-gray">
        {WEEK_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const visible = dayEvents.slice(0, 3);
          const hidden = dayEvents.length - visible.length;
          const today = isSameDay(day, new Date());
          const inMonth = isSameMonth(day, cursor);

          return (
            <div
              key={key}
              className={
                "min-h-[96px] border-b border-r border-mpd-border p-1.5 flex flex-col gap-1 " +
                (inMonth ? "bg-transparent" : "bg-mpd-black/30 opacity-60")
              }
            >
              <div
                className={
                  "text-[11px] font-mono self-end " +
                  (today
                    ? "text-mpd-gold font-semibold"
                    : "text-mpd-gray")
                }
              >
                {format(day, "d")}
              </div>
              <div className="flex flex-col gap-0.5">
                {visible.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => onSelectEvent(e)}
                    className={
                      "truncate rounded border px-1.5 py-0.5 text-left text-[10px] leading-tight transition-colors hover:opacity-80 " +
                      CATEGORY_COLORS[e.category]
                    }
                    title={e.title}
                  >
                    {e.title}
                  </button>
                ))}
                {hidden > 0 && (
                  <span className="px-1 text-[10px] text-mpd-gray">
                    +{hidden} más
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
