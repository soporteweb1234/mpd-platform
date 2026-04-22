import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DataCard } from "@/components/shared/DataCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { toNum } from "@/lib/money";
import { Users, TrendingUp, Wallet, LifeBuoy, UserPlus, Activity, PiggyBank, Coins, Eye } from "lucide-react";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // CAMBIOS 16.1 — ACTIVOS = usuarios con rakebackRecord este mes (importe ≠ 0)
  const activeUserIdsThisMonth = await prisma.rakebackRecord.findMany({
    where: { periodStart: { gte: monthStart }, rakebackAmount: { gt: 0 } },
    select: { userId: true },
    distinct: ["userId"],
  });

  const [
    totalUsers,
    monthRakeback,
    rakebackAgg,
    totalBalance,
    openTickets,
    recentUsers,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.rakebackRecord.aggregate({
      where: { periodStart: { gte: monthStart } },
      _sum: { rakebackAmount: true },
    }),
    // NGR TOTAL = sum(rakeGenerated). PROFITS = NGR − rakebackAmount pagado a jugadores.
    prisma.rakebackRecord.aggregate({
      _sum: { rakeGenerated: true, rakebackAmount: true },
    }),
    prisma.user.aggregate({
      where: { deletedAt: null },
      _sum: { availableBalance: true },
    }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true, name: true, email: true, stratum: true, status: true, createdAt: true,
        _count: { select: { roomAffiliations: true } },
      },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const activeUsers = activeUserIdsThisMonth.length;
  const ngrTotal = toNum(rakebackAgg._sum.rakeGenerated);
  const rakebackPaidTotal = toNum(rakebackAgg._sum.rakebackAmount);
  const profits = ngrTotal - rakebackPaidTotal;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
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
          color="amber"
          subtitle="Rakeback ≠ 0 este mes"
        />
        <DataCard
          title="Rakeback Mes"
          value={toNum(monthRakeback._sum.rakebackAmount)}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
        />
        <DataCard
          title="Profits"
          value={profits}
          format="currency"
          icon={<PiggyBank className="h-5 w-5" />}
          color="green"
          subtitle="NGR − rakeback pagado"
        />
        <DataCard
          title="NGR Total"
          value={ngrTotal}
          format="currency"
          icon={<Coins className="h-5 w-5" />}
          color="white"
          subtitle="Rake bruto generado"
        />
        <DataCard
          title="Saldo Circulante"
          value={toNum(totalBalance._sum.availableBalance)}
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
              {recentUsers.map((u) => {
                const isNew = u.createdAt >= sevenDaysAgo;
                return (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-mpd-border/30 last:border-0 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className={`text-sm truncate hover:text-mpd-gold transition-colors ${isNew ? "text-mpd-green font-medium" : "text-mpd-white"}`}
                        >
                          {u.name}
                        </Link>
                        {isNew && (
                          <Badge className="bg-mpd-green/10 text-mpd-green border-mpd-green/30 text-[10px] px-1.5 py-0 h-4">
                            NEW
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-mpd-gray truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <BadgeStratum stratum={u.stratum} />
                      <span className="text-[11px] text-mpd-gray-dark tabular-nums">
                        {u._count.roomAffiliations} salas
                      </span>
                      <Link
                        href={`/admin/users/${u.id}`}
                        title="Ver como usuario"
                        className="p-1 rounded hover:bg-mpd-surface text-mpd-gray hover:text-mpd-gold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
              {recentUsers.length === 0 && (
                <p className="text-sm text-mpd-gray text-center py-4">Sin registros recientes</p>
              )}
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
