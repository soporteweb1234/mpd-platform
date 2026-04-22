import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TicketThread } from "@/components/shared/TicketThread";
import type { TicketStatus } from "@prisma/client";

export const metadata = { title: "Ticket — Admin" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En curso",
  WAITING_USER: "Esperando usuario",
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

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const session = await requireAdmin();
  const { ticketId } = await params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, name: true, email: true } },
    },
  });
  if (!ticket) notFound();

  const messages = ticket.messages.map((m) => ({
    id: m.id,
    senderRole: m.senderRole,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    senderLabel:
      m.senderRole === "ADMIN" ? "Soporte MPD" : ticket.user?.name ?? "Usuario",
  }));

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/support">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a tickets
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-mpd-white">{ticket.subject}</h1>
            <Badge variant={STATUS_VARIANT[ticket.status]} className="text-[10px]">
              {STATUS_LABEL[ticket.status]}
            </Badge>
          </div>
          <p className="text-xs text-mpd-gray">
            {ticket.user?.name ?? ticket.user?.email} · {ticket.category} ·{" "}
            {new Date(ticket.createdAt).toLocaleString("es-ES")}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/users/${ticket.userId}`}>Ver usuario</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <TicketThread
            ticketId={ticket.id}
            currentUserId={session.user.id}
            currentRole="ADMIN"
            messages={messages}
            readOnly={ticket.status === "CLOSED"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
