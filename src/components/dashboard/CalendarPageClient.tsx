"use client";

import * as React from "react";
import { CalendarView } from "./CalendarView";
import { CalendarAgenda } from "./CalendarAgenda";
import { EventDetailDialog } from "./EventDetailDialog";
import type { CalendarEventSource } from "@/lib/actions/calendar";
import type { CalendarEventCategory } from "@prisma/client";

export interface SerializedEvent {
  id: string;
  source: CalendarEventSource;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  category: CalendarEventCategory;
  color: string | null;
  location: string | null;
  url: string | null;
  refUrl: string | null;
}

export function CalendarPageClient({ events }: { events: SerializedEvent[] }) {
  const [view, setView] = React.useState<"month" | "agenda">("month");
  const [selected, setSelected] = React.useState<SerializedEvent | null>(null);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("month")}
          className={
            "rounded-lg px-3 py-1.5 text-sm transition-colors " +
            (view === "month"
              ? "bg-mpd-gold/10 text-mpd-gold border border-mpd-gold/30"
              : "text-mpd-gray hover:text-mpd-white border border-transparent")
          }
        >
          Mes
        </button>
        <button
          onClick={() => setView("agenda")}
          className={
            "rounded-lg px-3 py-1.5 text-sm transition-colors " +
            (view === "agenda"
              ? "bg-mpd-gold/10 text-mpd-gold border border-mpd-gold/30"
              : "text-mpd-gray hover:text-mpd-white border border-transparent")
          }
        >
          Agenda
        </button>
      </div>

      {view === "month" ? (
        <CalendarView events={events} onSelectEvent={setSelected} />
      ) : (
        <CalendarAgenda events={events} onSelectEvent={setSelected} />
      )}

      <EventDetailDialog
        event={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
