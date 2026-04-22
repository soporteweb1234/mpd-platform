import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketThread } from "@/components/shared/TicketThread";
import type { TicketStatus } from "@prisma/client";

export const metadata = { title: "Ticket — Soporte" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  WAITING_USER: "Esperando tu respuesta",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const STATUS_VARIANT: Record<
  TicketStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  OPEN: "warning",
  IN_PROGRESS: "secondary",
  WAITING_USER: "warning",
  RESOLVED: "success",
  CLOSED: "outline",
};

export default async function DashboardTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          // ticketmessage no tiene relation con user directa; resolvemos label en mapeo
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!ticket || ticket.userId !== session.user.id) notFound();

  const messages = ticket.messages.map((m) => ({
    id: m.id,
    senderRole: m.senderRole,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    senderLabel: m.senderRole === "ADMIN" ? "Soporte MPD" : ticket.user?.name ?? "Tú",
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/support">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a soporte
        </Link>
      </Button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-mpd-white">{ticket.subject}</h1>
          <Badge variant={STATUS_VARIANT[ticket.status]} className="text-[10px]">
            {STATUS_LABEL[ticket.status]}
          </Badge>
        </div>
        <p className="text-xs text-mpd-gray font-mono">
          {ticket.category} · {new Date(ticket.createdAt).toLocaleString("es-ES")}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <TicketThread
            ticketId={ticket.id}
            currentUserId={session.user.id}
            currentRole="PLAYER"
            messages={messages}
            readOnly={ticket.status === "CLOSED" || ticket.status === "RESOLVED"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
