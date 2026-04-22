import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DataCard } from "@/components/shared/DataCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getStatusGalon, getStatusLevelLabel } from "@/lib/utils";
import { toNum } from "@/lib/money";
import { Clock, TrendingUp, Users, ArrowUpRight, ArrowDownRight, CheckCircle2, Landmark, Lock, Shield } from "lucide-react";
import Link from "next/link";
import { RakebackChart } from "@/components/charts/RakebackBarChart";
import { RakebackHistoryTable } from "@/components/dashboard/RakebackHistoryTable";
import { PerformanceDonut } from "@/components/dashboard/PerformanceDonut";

export const metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      availableBalance: true,
      pendingBalance: true,
      totalRakeback: true,
      statusLevel: true,
      prestigeScore: true,
      referrals: { where: { deletedAt: null }, select: { id: true } },
    },
  });

  // Rakeback del mes actual
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const monthRakeback = await prisma.rakebackRecord.aggregate({
    where: {
      userId,
      periodStart: { gte: monthStart },
      periodEnd: { lte: monthEnd },
    },
    _sum: { rakebackAmount: true },
  });

  // Últimos 3 meses de rakeback para la gráfica
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const rakebackHistory = await prisma.rakebackRecord.findMany({
    where: {
      userId,
      periodStart: { gte: threeMonthsAgo },
    },
    select: {
      periodStart: true,
      rakebackAmount: true,
      room: { select: { name: true } },
    },
    orderBy: { periodStart: "asc" },
  });

  // Histórico completo de rakeback (paginable en cliente)
  const fullRakebackHistory = await prisma.rakebackRecord.findMany({
    where: { userId },
    select: {
      id: true,
      periodStart: true,
      periodEnd: true,
      rakebackAmount: true,
      rakeGenerated: true,
      room: { select: { name: true } },
    },
    orderBy: { periodStart: "desc" },
  });

  // Actividad reciente
  const recentTransactions = await prisma.balanceTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Logros recientes
  const recentAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    orderBy: { unlockedAt: "desc" },
    take: 3,
    include: { achievement: true },
  });

  return {
    user: user!,
    monthRakeback: monthRakeback._sum.rakebackAmount ?? 0,
    rakebackHistory,
    fullRakebackHistory,
    recentTransactions,
    recentAchievements,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getDashboardData(session.user.id);
  const { user } = data;

  const galon = getStatusGalon(user.statusLevel);
  const totalRakebackNum = toNum(user.totalRakeback);

  // Agrupar rakeback por mes para la gráfica
  const chartData = data.rakebackHistory.reduce<Record<string, number>>((acc, r) => {
    const month = new Date(r.periodStart).toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
    acc[month] = (acc[month] ?? 0) + r.rakebackAmount;
    return acc;
  }, {});

  const chartArray = Object.entries(chartData).map(([month, amount]) => ({ month, amount }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Dashboard</h1>
        <p className="text-sm text-mpd-gray mt-1">Bienvenido de vuelta. Aquí tienes un resumen de tu actividad.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DataCard
          title="Saldo Disponible"
          value={toNum(user.availableBalance)}
          format="currency"
          icon={<CheckCircle2 className="h-5 w-5 text-mpd-green" />}
          color="green"
          subtitle="Disponible totalmente para uso o retiro"
        />
        <DataCard
          title="Saldo Pendiente"
          value={toNum(user.pendingBalance)}
          format="currency"
          icon={<Clock className="h-5 w-5 text-mpd-amber" />}
          color="amber"
          subtitle={`Rakeback mes ${new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleDateString("es-ES", { month: "long" })} — Estimación: lo conseguido menos servicios contratados y promociones. No vinculante.`}
        />
        <DataCard
          title="Saldo Ganado Total"
          value={totalRakebackNum}
          format="currency"
          icon={<TrendingUp className="h-5 w-5 text-mpd-gold" />}
          color="gold"
          subtitle="Total rakeback generado desde tu registro"
        />
        <DataCard
          title="Rakeback del Mes"
          value={data.monthRakeback}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
        />
        <DataCard
          title="Referidos Activos"
          value={user.referrals.length}
          format="number"
          icon={<Users className="h-5 w-5" />}
          color="white"
          subtitle="Gana meses VIP y % creciente del rakeback extra de tus referidos"
        />
        <div className="relative">
          <DataCard
            title="Saldo Invertido"
            value={0}
            format="currency"
            icon={<Landmark className="h-5 w-5 text-mpd-amber" />}
            color="amber"
            subtitle="Inversiones MPD, bancajes y Staking. Sujeto a riesgo — rentabilidad media variable ~6-7% mensual."
          />
          <div className="absolute inset-0 rounded-xl bg-mpd-black/55 backdrop-blur-[1px] flex items-center justify-center gap-2 text-xs font-medium text-mpd-gray pointer-events-none">
            <Lock className="h-4 w-4" /> Próximamente
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rakeback Chart — 3 meses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rakeback — Últimos 3 meses</CardTitle>
          </CardHeader>
          <CardContent>
            {chartArray.length > 0 ? (
              <RakebackChart data={chartArray} />
            ) : (
              <div className="flex items-center justify-center h-[200px] text-sm text-mpd-gray">
                Aún no tienes datos de rakeback
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Progress — con candado */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className={`h-4 w-4 ${galon.color}`} /> Progreso de Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-lg font-display font-semibold ${galon.color}`}>
                {galon.tier}
              </span>
              <span className="text-xs text-mpd-gray">Nivel {galon.nivel}</span>
            </div>
            <p className="text-xs text-mpd-gray">
              {getStatusLevelLabel(user.statusLevel)}. Tu Galón evoluciona con volumen,
              antigüedad y aportación a la comunidad.
            </p>
            <Link
              href="/dashboard/status"
              className="inline-flex items-center gap-1 text-xs text-mpd-gold hover:underline"
            >
              Ver detalle →
            </Link>
          </CardContent>
          <div className="absolute inset-0 rounded-xl bg-mpd-black/45 backdrop-blur-[1px] flex items-center justify-center gap-2 text-xs font-medium text-mpd-gray pointer-events-none">
            <Lock className="h-4 w-4" /> Próximamente
          </div>
        </Card>
      </div>

      {/* Donut rendimientos + Historial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Rendimientos por sala</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceDonut
              data={Object.entries(
                data.fullRakebackHistory.reduce<Record<string, number>>((acc, r) => {
                  const k = r.room?.name ?? "Sin sala";
                  acc[k] = (acc[k] ?? 0) + r.rakebackAmount;
                  return acc;
                }, {})
              ).map(([label, value]) => ({ label, value }))}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Historial de rakeback</CardTitle>
            <Link href="/dashboard/rakeback" className="text-xs text-mpd-gold hover:underline">
              Ver todo
            </Link>
          </CardHeader>
          <CardContent>
            <RakebackHistoryTable
              rows={data.fullRakebackHistory.map((r) => ({
                id: r.id,
                periodStart: r.periodStart.toISOString(),
                periodEnd: r.periodEnd.toISOString(),
                rakeAmount: r.rakeGenerated,
                rakebackAmount: r.rakebackAmount,
                room: r.room?.name ?? "—",
              }))}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Actividad Reciente</CardTitle>
            <Link href="/dashboard/balance" className="text-xs text-mpd-gold hover:underline">
              Ver todo
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentTransactions.length > 0 ? (
              <div className="space-y-3">
                {data.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-mpd-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${tx.amount >= 0 ? "bg-mpd-green/10" : "bg-mpd-red/10"}`}>
                        {tx.amount >= 0 ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-mpd-green" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-mpd-red" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-mpd-white">{tx.description}</p>
                        <p className="text-xs text-mpd-gray-dark">{formatDate(tx.createdAt)}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-mono font-medium ${tx.amount >= 0 ? "text-mpd-green" : "text-mpd-red"}`}>
                      {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mpd-gray text-center py-8">Sin actividad reciente</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Achievements — con candado */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Logros Recientes</CardTitle>
            <Link href="/dashboard/status" className="text-xs text-mpd-gold hover:underline">
              Ver todos
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentAchievements.length > 0 ? (
              <div className="space-y-3">
                {data.recentAchievements.map((ua) => (
                  <div key={ua.id} className="flex items-center gap-3 p-2 rounded-lg bg-mpd-black/30">
                    <span className="text-2xl">{ua.achievement.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-mpd-white">{ua.achievement.name}</p>
                      <p className="text-xs text-mpd-gray">{ua.achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mpd-gray text-center py-8">Aún no has desbloqueado logros</p>
            )}
          </CardContent>
          <div className="absolute inset-0 rounded-xl bg-mpd-black/45 backdrop-blur-[1px] flex items-center justify-center gap-2 text-xs font-medium text-mpd-gray pointer-events-none">
            <Lock className="h-4 w-4" /> Próximamente
          </div>
        </Card>
      </div>
    </div>
  );
}
