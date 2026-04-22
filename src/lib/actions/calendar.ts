import { prisma } from "@/lib/prisma";
import type {
  CalendarEventCategory,
  CalendarEventVisibility,
} from "@prisma/client";

export type CalendarEventSource =
  | "ADMIN"
  | "COURSE_START"
  | "COURSE_END"
  | "LESSON"
  | "STAKING_PERIOD_END"
  | "RAKEBACK_SETTLEMENT"
  | "WITHDRAWAL";

export interface CalendarEventUnion {
  id: string;
  source: CalendarEventSource;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  category: CalendarEventCategory;
  color: string | null;
  location: string | null;
  url: string | null;
  refUrl: string | null;
}

export interface CalendarRange {
  start: Date;
  end: Date;
}

function inRange(d: Date | null | undefined, range: CalendarRange): d is Date {
  if (!d) return false;
  const t = d.getTime();
  return t >= range.start.getTime() && t <= range.end.getTime();
}

export async function getCalendarEventsForUser(
  userId: string,
  range: CalendarRange,
  opts: { includeAdminOnly?: boolean } = {},
): Promise<CalendarEventUnion[]> {
  const visibilityFilter: CalendarEventVisibility[] = opts.includeAdminOnly
    ? ["PUBLIC", "STRATUM_ONLY", "ADMIN_ONLY"]
    : ["PUBLIC", "STRATUM_ONLY"];

  const [
    adminEvents,
    enrollments,
    stakingDeals,
    rakebackRecords,
    withdrawals,
  ] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        visibility: { in: visibilityFilter },
        startAt: { gte: range.start, lte: range.end },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.courseEnrollment.findMany({
      where: { userId },
      select: {
        id: true,
        course: {
          select: {
            id: true,
            title: true,
            slug: true,
            startDate: true,
            endDate: true,
            lessons: {
              where: {
                scheduledAt: { gte: range.start, lte: range.end },
              },
              select: {
                id: true,
                title: true,
                scheduledAt: true,
                description: true,
                recordingUrl: true,
              },
            },
          },
        },
      },
    }),
    prisma.stakingDeal.findMany({
      where: {
        userId,
        endDate: { gte: range.start, lte: range.end },
      },
      select: { id: true, endDate: true, totalBankroll: true, status: true },
    }),
    prisma.rakebackRecord.findMany({
      where: {
        userId,
        periodEnd: { gte: range.start, lte: range.end },
      },
      select: {
        id: true,
        period: true,
        periodEnd: true,
        rakebackAmount: true,
        status: true,
        room: { select: { name: true } },
      },
    }),
    prisma.withdrawalRequest.findMany({
      where: {
        userId,
        OR: [
          { processedAt: { gte: range.start, lte: range.end } },
          {
            status: "PENDING",
            createdAt: { gte: range.start, lte: range.end },
          },
        ],
      },
      select: {
        id: true,
        amountUsd: true,
        status: true,
        processedAt: true,
        createdAt: true,
        network: true,
      },
    }),
  ]);

  const events: CalendarEventUnion[] = [];

  for (const e of adminEvents) {
    events.push({
      id: `admin:${e.id}`,
      source: "ADMIN",
      title: e.title,
      description: e.description,
      startAt: e.startAt,
      endAt: e.endAt,
      category: e.category,
      color: e.color,
      location: e.location,
      url: e.url,
      refUrl: null,
    });
  }

  for (const en of enrollments) {
    const c = en.course;
    if (inRange(c.startDate, range)) {
      events.push({
        id: `course-start:${c.id}`,
        source: "COURSE_START",
        title: `Inicio curso: ${c.title}`,
        description: null,
        startAt: c.startDate,
        endAt: null,
        category: "FORMACION",
        color: null,
        location: null,
        url: null,
        refUrl: `/dashboard/cursos/${c.slug}`,
      });
    }
    if (inRange(c.endDate, range)) {
      events.push({
        id: `course-end:${c.id}`,
        source: "COURSE_END",
        title: `Fin curso: ${c.title}`,
        description: null,
        startAt: c.endDate,
        endAt: null,
        category: "FORMACION",
        color: null,
        location: null,
        url: null,
        refUrl: `/dashboard/cursos/${c.slug}`,
      });
    }
    for (const lesson of c.lessons) {
      if (lesson.scheduledAt) {
        events.push({
          id: `lesson:${lesson.id}`,
          source: "LESSON",
          title: `Clase: ${lesson.title}`,
          description: lesson.description,
          startAt: lesson.scheduledAt,
          endAt: null,
          category: "FORMACION",
          color: null,
          location: null,
          url: lesson.recordingUrl,
          refUrl: `/dashboard/cursos/${c.slug}`,
        });
      }
    }
  }

  for (const d of stakingDeals) {
    if (d.endDate) {
      events.push({
        id: `staking:${d.id}`,
        source: "STAKING_PERIOD_END",
        title: `Fin periodo staking (${d.totalBankroll.toFixed(0)}€)`,
        description: `Estado: ${d.status}`,
        startAt: d.endDate,
        endAt: null,
        category: "PAGOS",
        color: null,
        location: null,
        url: null,
        refUrl: `/dashboard/bancaje`,
      });
    }
  }

  for (const r of rakebackRecords) {
    events.push({
      id: `rakeback:${r.id}`,
      source: "RAKEBACK_SETTLEMENT",
      title: `Liquidación rakeback ${r.room.name}`,
      description: `${r.period} · ${r.rakebackAmount.toFixed(2)}€ · ${r.status}`,
      startAt: r.periodEnd,
      endAt: null,
      category: "PAGOS",
      color: null,
      location: null,
      url: null,
      refUrl: `/dashboard/rakeback`,
    });
  }

  for (const w of withdrawals) {
    const date = w.processedAt ?? w.createdAt;
    events.push({
      id: `withdrawal:${w.id}`,
      source: "WITHDRAWAL",
      title: `Retiro ${w.amountUsd.toFixed(2)} USDT (${w.network})`,
      description: `Estado: ${w.status}`,
      startAt: date,
      endAt: null,
      category: "PAGOS",
      color: null,
      location: null,
      url: null,
      refUrl: `/dashboard/retirada`,
    });
  }

  events.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  return events;
}
