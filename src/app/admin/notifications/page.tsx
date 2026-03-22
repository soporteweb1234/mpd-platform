import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationSendForm } from "@/components/forms/NotificationSendForm";

export const metadata = { title: "Notificaciones — Admin" };

export default async function AdminNotificationsPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const recentNotifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Notificaciones</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enviar Notificación</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationSendForm users={users} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentNotifications.map((n) => (
                <div key={n.id} className="py-2 border-b border-mpd-border/30 last:border-0">
                  <p className="text-sm text-mpd-white">{n.title}</p>
                  <p className="text-xs text-mpd-gray">{n.user.name} · {n.type}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
