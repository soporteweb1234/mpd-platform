"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function createTicket(data: {
  userId: string;
  subject: string;
  category: string;
  message: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: data.userId,
      subject: data.subject,
      category: data.category,
      messages: {
        create: {
          senderId: data.userId,
          senderRole: "PLAYER",
          content: data.message,
        },
      },
    },
  });

  return { success: true, ticketId: ticket.id };
}

export async function sendTicketMessage(data: {
  ticketId: string;
  senderId: string;
  senderRole: string;
  content: string;
}) {
  const session = await auth();
  if (!session?.user) return { error: "No autorizado" };

  await prisma.ticketMessage.create({
    data: {
      ticketId: data.ticketId,
      senderId: data.senderId,
      senderRole: data.senderRole,
      content: data.content,
    },
  });

  await prisma.supportTicket.update({
    where: { id: data.ticketId },
    data: {
      status: data.senderRole === "ADMIN" ? "WAITING_USER" : "IN_PROGRESS",
      updatedAt: new Date(),
    },
  });

  return { success: true };
}
