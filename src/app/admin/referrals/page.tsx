import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Link2, TrendingUp } from "lucide-react";

export const metadata = { title: "Referidos — Admin" };

export default async function AdminReferralsPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [referrers, totalReferred, attributedAgg, activeCommissions] = await Promise.all([
    prisma.user.findMany({
      where: { referrals: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        _count: { select: { referrals: true } },
      },
      orderBy: { referrals: { _count: "desc" } },
      take: 200,
    }),
    prisma.user.count({ where: { referredById: { not: null } } }),
    prisma.rakebackRecord.aggregate({
      where: {
        user: { referredById: { not: null } },
        periodStart: { gte: monthStart },
      },
      _sum: { rakebackAmount: true },
    }),
    prisma.referralCommission.count({ where: { active: true } }),
  ]);

  const attributedMonth = attributedAgg._sum.rakebackAmount ?? 0;

  const referrerIds = referrers.map((r) => r.id);
  const perReferrer = referrerIds.length
    ? await prisma.rakebackRecord.groupBy({
        by: ["userId"],
        where: {
          user: { referredById: { in: referrerIds } },
          periodStart: { gte: monthStart },
        },
        _sum: { rakebackAmount: true },
      })
    : [];

  const referredUserIds = perReferrer.map((r) => r.userId);
  const referredUsers = referredUserIds.length
    ? await prisma.user.findMany({
        where: { id: { in: referredUserIds } },
        select: { id: true, referredById: true },
      })
    : [];

  const attrByReferrer: Record<string, number> = {};
  for (const row of perReferrer) {
    const ref = referredUsers.find((u) => u.id === row.userId);
    if (!ref || !ref.referredById) continue;
    attrByReferrer[ref.referredById] =
      (attrByReferrer[ref.referredById] ?? 0) + (row._sum.rakebackAmount ?? 0);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Referidos</h1>
          <p className="text-sm text-mpd-gray">
            Programa de afiliación: comisiones por cadena de referidos.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/referrals/attributions">Attributions</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/referrals/fraud">Fraude</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/referrals/milestones">Milestones</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-mpd-gold" />
              </div>
              <p className="text-xs text-mpd-gray">Referrers activos</p>
            </div>
            <p className="text-2xl font-bold text-mpd-white font-mono">{referrers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-lg bg-mpd-green/10 flex items-center justify-center">
                <Link2 className="h-4 w-4 text-mpd-green" />
              </div>
              <p className="text-xs text-mpd-gray">Referidos totales</p>
            </div>
            <p className="text-2xl font-bold text-mpd-white font-mono">{totalReferred}</p>
            <p className="text-[11px] text-mpd-gray mt-1">
              {activeCommissions} overrides activos
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-lg bg-mpd-amber/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-mpd-amber" />
              </div>
              <p className="text-xs text-mpd-gray">Rakeback atribuido este mes</p>
            </div>
            <p className="text-2xl font-bold text-mpd-white font-mono">
              {attributedMonth.toFixed(2)} €
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          {referrers.length === 0 ? (
            <p className="text-sm text-mpd-gray py-6 text-center">
              Todavía no hay referrers con referidos registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border bg-mpd-black/30">
                    <th className="text-left py-2 px-3 text-mpd-gray font-medium">Usuario</th>
                    <th className="text-left py-2 px-3 text-mpd-gray font-medium">Código</th>
                    <th className="text-center py-2 px-3 text-mpd-gray font-medium">
                      Referidos
                    </th>
                    <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                      Rakeback atribuido (mes)
                    </th>
                    <th className="text-center py-2 px-3 text-mpd-gray font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.map((r) => (
                    <tr key={r.id} className="border-b border-mpd-border/30">
                      <td className="py-2 px-3">
                        <p className="text-mpd-white">{r.name ?? r.email}</p>
                        <p className="text-[11px] text-mpd-gray">{r.email}</p>
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {r.referralCode}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-mpd-white">
                        {r._count.referrals}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-mpd-white">
                        {(attrByReferrer[r.id] ?? 0).toFixed(2)} €
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/referrals/${r.id}`}>Ver detalle</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
