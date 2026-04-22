import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationComposer } from "@/components/admin/NotificationComposer";

export const metadata = { title: "Notificaciones — Admin" };

export default async function AdminNotificationsPage() {
  const [users, articles, recentNotifications] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.knowledgeArticle.findMany({
      select: { id: true, slug: true, title: true, content: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const userOptions = users.map((u) => ({
    id: u.id,
    name: u.name ?? u.email,
    email: u.email,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Notificaciones</h1>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enviar Notificación</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationComposer users={userOptions} articles={articles} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {recentNotifications.map((n) => (
                <div key={n.id} className="py-2 border-b border-mpd-border/30 last:border-0">
                  <p className="text-sm text-mpd-white">{n.title}</p>
                  <p className="text-xs text-mpd-gray">{n.user.name} · {n.type}</p>
                </div>
              ))}
              {recentNotifications.length === 0 && (
                <p className="text-xs text-mpd-gray">Sin notificaciones recientes.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
