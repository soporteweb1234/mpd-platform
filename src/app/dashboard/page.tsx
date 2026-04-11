import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DataCard } from "@/components/shared/DataCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { formatCurrency, formatDate, getStratumLabel } from "@/lib/utils";
import { STRATUM_THRESHOLDS } from "@/lib/constants";
import { Wallet, Clock, TrendingUp, Users, ArrowUpRight, ArrowDownRight, CheckCircle2, Landmark } from "lucide-react";
import Link from "next/link";
import { RakebackChart } from "@/components/charts/RakebackBarChart";

export const metadata = { title: "Dashboard" };

async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      availableBalance: true,
      pendingBalance: true,
      totalRakeback: true,
      stratum: true,
      points: true,
      level: true,
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

  // Últimos 6 meses de rakeback para la gráfica
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const rakebackHistory = await prisma.rakebackRecord.findMany({
    where: {
      userId,
      periodStart: { gte: sixMonthsAgo },
    },
    select: {
      periodStart: true,
      rakebackAmount: true,
      room: { select: { name: true } },
    },
    orderBy: { periodStart: "asc" },
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
    recentTransactions,
    recentAchievements,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const data = await getDashboardData(session.user.id);
  const { user } = data;

  // Calcular progreso de estrato
  const strataOrder = ["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"] as const;
  const currentIndex = strataOrder.indexOf(user.stratum);
  const nextStratum = currentIndex < strataOrder.length - 1 ? strataOrder[currentIndex + 1] : null;
  const currentThreshold = STRATUM_THRESHOLDS[user.stratum];
  const nextThreshold = nextStratum ? STRATUM_THRESHOLDS[nextStratum] : user.totalRakeback;
  const progress = nextStratum
    ? Math.min(((user.totalRakeback - currentThreshold) / (nextThreshold - currentThreshold)) * 100, 100)
    : 100;

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
          value={user.availableBalance}
          format="currency"
          icon={<CheckCircle2 className="h-5 w-5 text-mpd-green" />}
          color="green"
          subtitle="Disponible totalmente para uso o retiro"
        />
        <DataCard
          title="Saldo Pendiente"
          value={user.pendingBalance}
          format="currency"
          icon={<Clock className="h-5 w-5 text-mpd-amber" />}
          color="amber"
          subtitle={`Rakeback mes ${new Date(new Date().getFullYear(), new Date().getMonth() - 1).toLocaleDateString("es-ES", { month: "long" })} — Estimación: lo conseguido menos servicios contratados y promociones. No vinculante.`}
        />
        <DataCard
          title="Saldo Ganado Total"
          value={user.totalRakeback}
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
        <DataCard
          title="Saldo Invertido"
          value={0}
          format="currency"
          icon={<Landmark className="h-5 w-5 text-mpd-amber" />}
          color="amber"
          subtitle="Sujeto a inversiones MPD, bancajes y Staking MPD. Sujeto a riesgo. Rentabilidad media variable ~6-7% mensual"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rakeback Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rakeback — Últimos 6 meses</CardTitle>
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

        {/* Stratum Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso de Estrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <BadgeStratum stratum={user.stratum} />
              {nextStratum && (
                <span className="text-xs text-mpd-gray">→ {getStratumLabel(nextStratum)}</span>
              )}
            </div>
            <div className="w-full bg-mpd-black rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mpd-gold-dark to-mpd-gold rounded-full transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
            {nextStratum && (
              <p className="text-xs text-mpd-gray">
                Genera {formatCurrency(nextThreshold - user.totalRakeback)} más de rakeback para alcanzar{" "}
                <span className="text-mpd-gold">{getStratumLabel(nextStratum)}</span>
              </p>
            )}
            <div className="pt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-mpd-gray">Puntos</span>
                <span className="text-mpd-white font-mono">{user.points.toLocaleString("es-ES")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-mpd-gray">Nivel</span>
                <span className="text-mpd-white font-mono">{user.level}</span>
              </div>
            </div>
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

        {/* Recent Achievements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Logros Recientes</CardTitle>
            <Link href="/dashboard/achievements" className="text-xs text-mpd-gold hover:underline">
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
        </Card>
      </div>
    </div>
  );
}
