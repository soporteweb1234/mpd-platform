import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Soporte — Admin" };

const statusLabels: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  WAITING_USER: "Esperando usuario",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const statusVariant: Record<string, "warning" | "default" | "success" | "secondary"> = {
  OPEN: "warning",
  IN_PROGRESS: "default",
  WAITING_USER: "warning",
  RESOLVED: "success",
  CLOSED: "secondary",
};

const priorityVariant: Record<string, "secondary" | "default" | "warning" | "destructive"> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "destructive",
};

export default async function AdminSupportPage() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: [{ status: "asc" }, { priority: "desc" }, { updatedAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Tickets de Soporte</h1>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mpd-border bg-mpd-black/30">
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Asunto</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Jugador</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Categoría</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Prioridad</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Estado</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Mensajes</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Fecha</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-mpd-border/30 hover:bg-mpd-surface-hover/50">
                    <td className="py-3 px-4 text-mpd-white">{ticket.subject}</td>
                    <td className="py-3 px-4 text-mpd-gray">{ticket.user.name}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-[10px]">{ticket.category}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={priorityVariant[ticket.priority]}>{ticket.priority}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={statusVariant[ticket.status]}>{statusLabels[ticket.status]}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-mpd-gray">{ticket._count.messages}</td>
                    <td className="py-3 px-4 text-right text-mpd-gray">{formatDate(ticket.updatedAt)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/support/${ticket.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
