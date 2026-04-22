"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/**
 * Escala un ChatQueryLog a un SupportTicket.
 * - Verifica sesión (userId del server, no del cliente).
 * - Verifica que el log pertenezca al usuario.
 * - Construye transcript (query + answer) como cuerpo del ticket.
 * - Marca el log con escalatedToTicketId (idempotente — si ya existe, lo reutiliza).
 *
 * Regla 4.A.10: ActivityLog + revalidatePath.
 */
export async function escalateChatToTicket(params: {
  chatLogId: string;
  category?: string;
}): Promise<{ ticketId?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "No autorizado" };
  const userId = session.user.id;

  const log = await prisma.chatQueryLog.findUnique({
    where: { id: params.chatLogId },
    select: {
      id: true,
      userId: true,
      query: true,
      answer: true,
      escalatedToTicketId: true,
    },
  });
  if (!log) return { error: "Conversación no encontrada" };
  if (log.userId !== userId) return { error: "No autorizado para esta conversación" };

  // Idempotencia: si ya existe ticket, devolverlo.
  if (log.escalatedToTicketId) {
    return { ticketId: log.escalatedToTicketId };
  }

  const subject = log.query.slice(0, 80);
  const category = params.category ?? "BOT";
  const transcript = [
    "Consulta enviada al asistente MIKE:",
    "",
    `> ${log.query}`,
    "",
    log.answer
      ? "Respuesta del asistente:"
      : "El asistente no pudo generar respuesta.",
    log.answer ? "" : "",
    log.answer ?? "",
    "",
    "— Escalado automáticamente porque el asistente no encontró información suficiente en la base de conocimiento.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      category,
      messages: {
        create: {
          senderId: userId,
          senderRole: "PLAYER",
          content: transcript,
        },
      },
    },
    select: { id: true },
  });

  await prisma.chatQueryLog.update({
    where: { id: log.id },
    data: { escalatedToTicketId: ticket.id },
  });

  await prisma.activityLog.create({
    data: {
      userId,
      action: "CHAT_ESCALATED_TO_TICKET",
      entityType: "SupportTicket",
      entityId: ticket.id,
      details: { chatLogId: log.id },
    },
  });

  revalidatePath("/dashboard/support");
  revalidatePath("/dashboard/chat");

  return { ticketId: ticket.id };
}
