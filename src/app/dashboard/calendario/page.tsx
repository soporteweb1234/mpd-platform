import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CalendarPageClient } from "@/components/dashboard/CalendarPageClient";
import { getCalendarEventsForUser } from "@/lib/actions/calendar";

export const metadata = { title: "Calendario · MPD" };

export default async function CalendarioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59);

  const events = await getCalendarEventsForUser(session.user.id, {
    start: rangeStart,
    end: rangeEnd,
  });

  const serialized = events.map((e) => ({
    ...e,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt ? e.endAt.toISOString() : null,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-2xl uppercase tracking-wider text-mpd-white">
          Calendario
        </h1>
        <p className="mt-1 text-sm text-mpd-gray">
          Tus cursos, periodos de staking, liquidaciones y eventos de la comunidad.
        </p>
      </header>

      <CalendarPageClient events={serialized} />
    </div>
  );
}
