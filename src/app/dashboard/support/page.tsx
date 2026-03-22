import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { Plus, MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Soporte" };

const statusLabels: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  WAITING_USER: "Esperando respuesta",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const statusVariant: Record<string, "warning" | "default" | "success" | "secondary" | "destructive"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  WAITING_USER: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
};

export default async function SupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Soporte</h1>
        <Button asChild>
          <Link href="/dashboard/support/new">
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Ticket
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          {tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-mpd-surface-hover transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-mpd-gray shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-mpd-white">{ticket.subject}</p>
                      <p className="text-xs text-mpd-gray">{ticket.category} · {formatDate(ticket.createdAt)}</p>
                    </div>
                  </div>
                  <Badge variant={statusVariant[ticket.status]}>
                    {statusLabels[ticket.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin tickets"
              description="¿Necesitas ayuda? Crea un ticket de soporte."
              actionLabel="Crear Ticket"
              actionHref="/dashboard/support/new"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}