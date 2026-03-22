import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDateTime } from "@/lib/utils";
import { Bell, TrendingUp, Wallet, Trophy, Gift, Info } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Notificaciones" };

const typeIcons: Record<string, React.ReactNode> = {
  RAKEBACK: <TrendingUp className="h-4 w-4 text-mpd-gold" />,
  BALANCE: <Wallet className="h-4 w-4 text-mpd-green" />,
  ACHIEVEMENT: <Trophy className="h-4 w-4 text-mpd-amber" />,
  DROP: <Gift className="h-4 w-4 text-mpd-gold" />,
  SYSTEM: <Info className="h-4 w-4 text-mpd-gray" />,
};

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true, readAt: new Date() },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Notificaciones</h1>

      {notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={!n.read ? "border-mpd-gold/20" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{typeIcons[n.type] ?? <Bell className="h-4 w-4 text-mpd-gray" />}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-mpd-white">{n.title}</h3>
                      {!n.read && <div className="h-2 w-2 rounded-full bg-mpd-gold" />}
                    </div>
                    <p className="text-xs text-mpd-gray mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-mpd-gray-dark mt-1">{formatDateTime(n.createdAt)}</p>
                    {n.link && (
                      <Link href={n.link} className="text-xs text-mpd-gold hover:underline mt-1 inline-block">
                        Ver detalle →
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin notificaciones" description="Tus notificaciones aparecerán aquí." />
      )}
    </div>
  );
}