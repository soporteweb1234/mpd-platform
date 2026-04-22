import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { CalendarEventsTable } from "@/components/admin/CalendarEventsTable";

export const metadata = { title: "Calendario — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminCalendarPage() {
  await requireAdmin();

  const events = await prisma.calendarEvent.findMany({
    orderBy: { startAt: "desc" },
    take: 200,
    include: {
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  const serialized = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt ? e.endAt.toISOString() : null,
    category: e.category,
    visibility: e.visibility,
    color: e.color,
    location: e.location,
    url: e.url,
    creator: e.creator,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Calendario</h1>
          <p className="text-sm text-mpd-gray">
            {events.length} {events.length === 1 ? "evento" : "eventos"} en los últimos 200
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <CalendarDays className="h-10 w-10 mx-auto text-mpd-gray mb-3" />
            <p className="text-sm text-mpd-gray">
              No hay eventos todavía. Crea el primero.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <CalendarEventsTable events={serialized} />
    </div>
  );
}
