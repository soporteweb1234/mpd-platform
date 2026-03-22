import { prisma } from "@/lib/prisma";
import { DataCard } from "@/components/shared/DataCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Users, TrendingUp, Wallet, LifeBuoy, UserPlus, Activity } from "lucide-react";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    activeUsers,
    monthRakeback,
    totalRakeback,
    totalBalance,
    openTickets,
    newUsersMonth,
    recentUsers,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.rakebackRecord.aggregate({
      where: { periodStart: { gte: monthStart } },
      _sum: { rakebackAmount: true },
    }),
    prisma.rakebackRecord.aggregate({ _sum: { rakebackAmount: true } }),
    prisma.user.aggregate({
      where: { deletedAt: null },
      _sum: { availableBalance: true },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart }, deletedAt: null } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, email: true, stratum: true, status: true, createdAt: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DataCard
          title="Jugadores"
          value={totalUsers}
          icon={<Users className="h-5 w-5" />}
          color="white"
        />
        <DataCard
          title="Activos"
          value={activeUsers}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <DataCard
          title="Rakeback Mes"
          value={monthRakeback._sum.rakebackAmount ?? 0}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
        />
        <DataCard
          title="Rakeback Total"
          value={totalRakeback._sum.rakebackAmount ?? 0}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="white"
        />
        <DataCard
          title="Saldo Circulante"
          value={totalBalance._sum.availableBalance ?? 0}
          format="currency"
          icon={<Wallet className="h-5 w-5" />}
          color="amber"
        />
        <DataCard
          title="Tickets Abiertos"
          value={openTickets}
          icon={<LifeBuoy className="h-5 w-5" />}
          color={openTickets > 0 ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-mpd-gold" />
              Últimos Registros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-mpd-border/30 last:border-0">
                  <div>
                    <p className="text-sm text-mpd-white">{u.name}</p>
                    <p className="text-xs text-mpd-gray">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BadgeStratum stratum={u.stratum} />
                    <BadgeStatus status={u.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-mpd-gold" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((log) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-mpd-border/30 last:border-0">
                    <div>
                      <p className="text-sm text-mpd-white">{log.action}</p>
                      <p className="text-xs text-mpd-gray">{log.user?.name ?? "Sistema"}</p>
                    </div>
                    <span className="text-xs text-mpd-gray-dark">{formatDate(log.createdAt)}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-mpd-gray text-center py-4">Sin actividad reciente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
