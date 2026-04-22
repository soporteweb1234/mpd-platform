import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataCard } from "@/components/shared/DataCard";
import { TrendingUp, Upload, Calendar } from "lucide-react";
import Link from "next/link";
import { RakebackLoadForm } from "@/components/forms/RakebackLoadForm";
import { toNum } from "@/lib/money";

export const metadata = { title: "Rakeback — Admin" };

export default async function AdminRakebackPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalRakeback, monthRakeback, recentRecords, users, rooms] = await Promise.all([
    prisma.rakebackRecord.aggregate({ _sum: { rakebackAmount: true } }),
    prisma.rakebackRecord.aggregate({
      where: { periodStart: { gte: monthStart } },
      _sum: { rakebackAmount: true },
    }),
    prisma.rakebackRecord.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true, email: true } },
        room: { select: { name: true } },
      },
    }),
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, email: true, availableBalance: true },
      orderBy: { name: "asc" },
    }),
    prisma.pokerRoom.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, rakebackBase: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Gestión de Rakeback</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/rakeback/upload">
            <Upload className="h-4 w-4 mr-1" />
            Carga CSV
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DataCard
          title="Rakeback Total Distribuido"
          value={totalRakeback._sum.rakebackAmount ?? 0}
          format="currency"
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
        />
        <DataCard
          title="Rakeback Este Mes"
          value={monthRakeback._sum.rakebackAmount ?? 0}
          format="currency"
          icon={<Calendar className="h-5 w-5" />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Load Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cargar Rakeback Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <RakebackLoadForm
              users={users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                availableBalance: toNum(u.availableBalance),
              }))}
              rooms={rooms}
            />
          </CardContent>
        </Card>

        {/* Recent Records */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimas Cargas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {recentRecords.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-mpd-border/30 last:border-0">
                  <div>
                    <p className="text-sm text-mpd-white">{r.user.name}</p>
                    <p className="text-xs text-mpd-gray">{r.room.name} · {r.period}</p>
                  </div>
                  <span className="text-sm font-mono text-mpd-green">{formatCurrency(r.rakebackAmount)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
