"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const UpdateAffiliationSchema = z.object({
  affiliationId: z.string().min(1),
  nickname: z.string().trim().max(60).nullable().optional(),
  roomEmail: z
    .string()
    .trim()
    .max(120)
    .email("Email no válido")
    .nullable()
    .or(z.literal(""))
    .optional(),
  referralCodeAtRoom: z.string().trim().max(60).nullable().optional(),
  codeId: z.string().trim().max(60).nullable().optional(),
});

export async function updateRoomAffiliation(raw: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "No autenticado" } as const;

  const parsed = UpdateAffiliationSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos no válidos" } as const;
  }
  const { affiliationId, nickname, roomEmail, referralCodeAtRoom, codeId } = parsed.data;

  const aff = await prisma.roomAffiliation.findUnique({
    where: { id: affiliationId },
    select: { userId: true, room: { select: { slug: true } } },
  });
  if (!aff || aff.userId !== session.user.id) {
    return { ok: false, error: "Afiliación no encontrada" } as const;
  }

  await prisma.roomAffiliation.update({
    where: { id: affiliationId },
    data: {
      nickname: nickname ?? null,
      roomEmail: roomEmail ? roomEmail : null,
      referralCodeAtRoom: referralCodeAtRoom ?? null,
      codeId: codeId ?? null,
    },
  });

  revalidatePath("/dashboard/rooms");
  revalidatePath(`/dashboard/rooms/${aff.room.slug}`);
  return { ok: true } as const;
}
