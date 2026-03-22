import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCard } from "@/components/shared/DataCard";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, DollarSign, Calendar } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Rakeback" };

export default async function RakebackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const records = await prisma.rakebackRecord.findMany({
    where: { userId: session.user.id },
    include: { room: { select: { name: true, logo: true } } },
    orderBy: { periodStart: "desc" },
  });

  const totalRakeback = records.reduce((sum, r) => sum + r.rakebackAmount, 0);
  const totalRake = records.reduce((sum, r) => sum + r.rakeGenerated, 0);
  const avgPercent = totalRake > 0 ? (totalRakeback / totalRake) * 100 : 0;

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
      <h1 className="text-2xl font-bold text-mpd-white">Rakeback</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DataCard
          title="Rakeback Total"
          value={totalRakeback}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
        />
        <DataCard
          title="Rake Total Generado"
          value={totalRake}
          format="currency"
          icon={<DollarSign className="h-5 w-5" />}
          color="white"
        />
        <DataCard
          title="% Medio Rakeback"
          value={avgPercent}
          format="percent"
          icon={<Calendar className="h-5 w-5" />}
          color="green"
        />
      </div>

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
                    <th className="text-right py-3 px-2 text-mpd-gray font-medium">Rake</th>
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
                      <td className="py-3 px-2 text-right font-mono text-mpd-white">{formatCurrency(r.rakeGenerated)}</td>
                      <td className="py-3 px-2 text-right font-mono text-mpd-gray">{r.rakebackPercent.toFixed(1)}%</td>
                      <td className="py-3 px-2 text-right font-mono text-mpd-green font-medium">{formatCurrency(r.rakebackAmount)}</td>
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
