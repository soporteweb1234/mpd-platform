import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCard } from "@/components/shared/DataCard";
import { Badge } from "@/components/ui/badge";
import { formatUSD } from "@/lib/utils";
import { TrendingUp, CalendarDays, Trophy, Info, CheckCircle2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { RakebackPdfButton } from "@/components/dashboard/RakebackPdfButton";
import { RakebackChart } from "@/components/charts/RakebackBarChart";

export const metadata = { title: "Rakeback" };

export default async function RakebackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [records, user] = await Promise.all([
    prisma.rakebackRecord.findMany({
      where: { userId: session.user.id },
      include: { room: { select: { name: true, logo: true } } },
      orderBy: { periodStart: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    }),
  ]);

  const totalRakeback = records.reduce((sum, r) => sum + r.rakebackAmount, 0);

  // Rakeback del mes en curso (período cuyo inicio cae dentro del mes actual)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const monthRakeback = records
    .filter((r) => r.periodStart >= monthStart && r.periodStart < nextMonthStart)
    .reduce((sum, r) => sum + r.rakebackAmount, 0);

  // Sala con más rakeback acumulado
  const byRoom = new Map<string, number>();
  for (const r of records) {
    byRoom.set(r.room.name, (byRoom.get(r.room.name) ?? 0) + r.rakebackAmount);
  }
  const topRoom = [...byRoom.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([name, amount]) => ({ name, amount }))[0];

  // Datos para la gráfica: agrupados por mes, orden cronológico
  const byMonth = new Map<number, { month: string; amount: number }>();
  for (const r of records) {
    const d = new Date(r.periodStart);
    const sortKey = d.getFullYear() * 12 + d.getMonth();
    const label = d
      .toLocaleDateString("es-ES", { month: "short", year: "2-digit" })
      .replace(".", "");
    const existing = byMonth.get(sortKey);
    if (existing) {
      existing.amount += r.rakebackAmount;
    } else {
      byMonth.set(sortKey, { month: label, amount: r.rakebackAmount });
    }
  }
  const chartData = [...byMonth.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, v]) => ({ ...v, amount: Number(v.amount.toFixed(2)) }));

  const statusColors: Record<string, string> = {
    PENDING: "warning",
    AVAILABLE: "success",
    REDEEMED: "default",
    WITHDRAWN: "secondary",
    EXPIRED: "destructive",
  };

  const statusLabels: Record<string, string> = {
    PENDING: "Pendiente",
    AVAILABLE: "Disponible",
    REDEEMED: "Canjeado",
    WITHDRAWN: "Retirado",
    EXPIRED: "Expirado",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Rakeback</h1>
        <RakebackPdfButton
          records={records.map((r) => ({
            period: r.period,
            roomName: r.room.name,
            rakeGenerated: r.rakeGenerated,
            rakebackPercent: r.rakebackPercent,
            rakebackAmount: r.rakebackAmount,
            status: r.status,
          }))}
          userName={user?.name ?? session.user.email ?? "Jugador"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DataCard
          title="Histórico ganado total"
          value={totalRakeback}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
          subtitle="Total aproximado de rakeback generado desde tu registro. Puede excluir bonificaciones."
        />
        <DataCard
          title="Rakeback Este Mes"
          value={monthRakeback}
          format="currency"
          icon={<CalendarDays className="h-5 w-5" />}
          color="green"
          subtitle={now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
        />
        <Card className="hover:border-mpd-border-light transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-mpd-gray uppercase tracking-wider font-medium">
                Top Sala
              </span>
              <Trophy className="h-5 w-5 text-mpd-gold" />
            </div>
            <p className="text-2xl font-bold font-mono text-mpd-gold truncate">
              {topRoom?.name ?? "—"}
            </p>
            <p className="text-[11px] text-mpd-gray-dark mt-1 leading-snug">
              {topRoom
                ? `${formatUSD(topRoom.amount)} de rakeback generado`
                : "Sin datos todavía"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Histograma mensual */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolución mensual</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <RakebackChart data={chartData} />
          ) : (
            <div className="flex items-center justify-center h-[220px] text-sm text-mpd-gray">
              Aún no tienes datos de rakeback para graficar
            </div>
          )}
        </CardContent>
      </Card>

      {/* NGR Explanation */}
      <Card className="border-mpd-gold/20">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-mpd-gold shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-mpd-white mb-1">¿Qué es el Rakeback NGR?</h3>
              <p className="text-sm text-mpd-gray leading-relaxed">
                <span className="font-medium text-mpd-white">Rakeback NGR (Net Gaming Revenue):</span> es el porcentaje de excedente de comisiones que queda tras los descuentos que la sala ha aplicado internamente y de forma directa al jugador en forma de rakeback interno, bonos de bienvenida, retiros, jackpot, etc. Es la base reguladora sobre la que se calcula tu rakeback externo a percibir por parte de MPD.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transparencia de Cálculo — 4 pasos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">¿Cómo se calcula tu rakeback?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-3 text-sm text-mpd-gray">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mpd-gold/10 text-mpd-gold text-xs font-bold">1</span>
              <p>
                <span className="text-mpd-white font-medium">Rake generado:</span> cada vez que
                juegas, la sala cobra una comisión (rake). Este dato se importa directamente
                desde la sala.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mpd-gold/10 text-mpd-gold text-xs font-bold">2</span>
              <p>
                <span className="text-mpd-white font-medium">NGR (Net Gaming Revenue):</span> es
                el neto del rake generado bruto, descontando el rakeback interno percibido,
                bonificaciones y/o promociones que la sala te haya dado o cobrado directa o
                indirectamente. El resultado es el NGR.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mpd-gold/10 text-mpd-gold text-xs font-bold">3</span>
              <p>
                <span className="text-mpd-white font-medium">Porcentaje negociado:</span> MPD
                aplica sobre el NGR un porcentaje de rakeback negociado con cada sala y te lo
                devuelve de forma directa. Este % es superior al estándar gracias a nuestros
                acuerdos.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mpd-gold/10 text-mpd-gold text-xs font-bold">4</span>
              <p>
                <span className="text-mpd-white font-medium">Tu rakeback:</span> el resultado se
                acumula como saldo disponible en tu cuenta MPD. Puedes solicitar su retiro o
                aprovecharlo para beneficiarte de servicios con descuento MPD.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-mpd-black/50 border border-mpd-border">
            <p className="text-xs text-mpd-gray-dark italic">
              Los datos se actualizan periódicamente según los reportes de cada sala. Si tienes
              dudas sobre algún cálculo específico, contacta con soporte.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Rakeback</CardTitle>
        </CardHeader>
        <CardContent>
          {records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border">
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Período</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Sala</th>
                    <th className="text-right py-3 px-2 text-mpd-gray font-medium">Comisión NGR</th>
                    <th className="text-right py-3 px-2 text-mpd-gray font-medium">%</th>
                    <th className="text-right py-3 px-2 text-mpd-gray font-medium">Rakeback</th>
                    <th className="text-center py-3 px-2 text-mpd-gray font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-mpd-border/50 hover:bg-mpd-surface-hover/50">
                      <td className="py-3 px-2 text-mpd-white">{r.period}</td>
                      <td className="py-3 px-2 text-mpd-white">{r.room.name}</td>
                      <td className="py-3 px-2 text-right font-mono text-mpd-white">{formatUSD(r.rakeGenerated)}</td>
                      <td className="py-3 px-2 text-right font-mono text-mpd-gray">{r.rakebackPercent.toFixed(1)}%</td>
                      <td className="py-3 px-2 text-right font-mono text-mpd-green font-medium">{formatUSD(r.rakebackAmount)}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={statusColors[r.status] as "default" | "success" | "warning" | "destructive" | "secondary"}>
                          {statusLabels[r.status] ?? r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin datos de rakeback"
              description="Tu rakeback aparecerá aquí cuando esté disponible."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
