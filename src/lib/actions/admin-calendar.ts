"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import type {
  CalendarEventCategory,
  CalendarEventVisibility,
} from "@prisma/client";

const CATEGORY_VALUES = [
  "GENERAL",
  "TORNEO",
  "COMUNIDAD",
  "MANTENIMIENTO",
  "FORMACION",
  "PAGOS",
] as const;

const VISIBILITY_VALUES = ["PUBLIC", "STRATUM_ONLY", "ADMIN_ONLY"] as const;

const baseSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  startAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endAt: z
    .string()
    .datetime({ offset: true })
    .or(z.string().min(1))
    .optional()
    .or(z.literal("")),
  category: z.enum(CATEGORY_VALUES).default("GENERAL"),
  visibility: z.enum(VISIBILITY_VALUES).default("PUBLIC"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "color debe ser hex #RRGGBB")
    .optional()
    .or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  url: z.string().url("url inválida").optional().or(z.literal("")),
});

type EventInput = z.infer<typeof baseSchema>;

function normalize(input: EventInput) {
  const start = new Date(input.startAt);
  const end = input.endAt ? new Date(input.endAt) : null;
  if (Number.isNaN(start.getTime())) {
    throw new Error("startAt no es una fecha válida");
  }
  if (end && Number.isNaN(end.getTime())) {
    throw new Error("endAt no es una fecha válida");
  }
  if (end && end.getTime() < start.getTime()) {
    throw new Error("endAt debe ser posterior a startAt");
  }
  return {
    title: input.title,
    description: input.description?.trim() || null,
    startAt: start,
    endAt: end,
    category: input.category as CalendarEventCategory,
    visibility: input.visibility as CalendarEventVisibility,
    color: input.color?.trim() || null,
    location: input.location?.trim() || null,
    url: input.url?.trim() || null,
  };
}

export async function createCalendarEvent(
  raw: unknown,
): Promise<{ ok?: true; id?: string; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  let data;
  try {
    data = normalize(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Validación" };
  }

  const event = await prisma.calendarEvent.create({
    data: { ...data, createdBy: session.user.id },
    select: { id: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CALENDAR_EVENT_CREATED",
      entityType: "CalendarEvent",
      entityId: event.id,
      details: { title: data.title, category: data.category },
    },
  });

  revalidatePath("/admin/calendario");
  revalidatePath("/dashboard/calendario");
  return { ok: true, id: event.id };
}

export async function updateCalendarEvent(
  id: string,
  raw: unknown,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const parsed = baseSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  let data;
  try {
    data = normalize(parsed.data);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Validación" };
  }

  const existing = await prisma.calendarEvent.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) return { error: "Evento no encontrado" };

  await prisma.calendarEvent.update({ where: { id }, data });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CALENDAR_EVENT_UPDATED",
      entityType: "CalendarEvent",
      entityId: id,
      details: { title: data.title },
    },
  });

  revalidatePath("/admin/calendario");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}

export async function deleteCalendarEvent(
  id: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const existing = await prisma.calendarEvent.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!existing) return { error: "Evento no encontrado" };

  await prisma.calendarEvent.delete({ where: { id } });

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "CALENDAR_EVENT_DELETED",
      entityType: "CalendarEvent",
      entityId: id,
      details: { title: existing.title },
    },
  });

  revalidatePath("/admin/calendario");
  revalidatePath("/dashboard/calendario");
  return { ok: true };
}
