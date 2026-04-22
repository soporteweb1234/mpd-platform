import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { formatCurrency, formatDate, getRoleLabel } from "@/lib/utils";
import { toNum } from "@/lib/money";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Download, Search } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Usuarios — Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; stratum?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const perPage = 20;
  const skip = (page - 1) * perPage;
  const q = params.q?.trim() ?? "";

  const where: Record<string, unknown> = { deletedAt: null };
  if (params.stratum) where.stratum = params.stratum;
  if (params.status) where.status = params.status;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { nickname: { contains: q, mode: "insensitive" } },
    ];
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip,
      select: {
        id: true, name: true, email: true, nickname: true, avatar: true,
        role: true, stratum: true, status: true,
        totalRakeback: true, availableBalance: true, investedBalance: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const monthAgg = users.length
    ? await prisma.rakebackRecord.groupBy({
        by: ["userId"],
        where: {
          userId: { in: users.map((u) => u.id) },
          periodStart: { gte: monthStart },
        },
        _sum: { rakebackAmount: true },
      })
    : [];
  const monthMap = new Map(monthAgg.map((r) => [r.userId, toNum(r._sum.rakebackAmount)]));

  const totalPages = Math.ceil(total / perPage);
  const exportUrl = `/api/admin/users/export${q ? `?q=${encodeURIComponent(q)}` : ""}`;

  const qsBase: Record<string, string> = {};
  if (q) qsBase.q = q;
  if (params.stratum) qsBase.stratum = params.stratum;
  if (params.status) qsBase.status = params.status;
  const buildPageUrl = (p: number) =>
    `/admin/users?${new URLSearchParams({ ...qsBase, page: String(p) }).toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Usuarios</h1>
          <p className="text-sm text-mpd-gray">{total} usuarios registrados</p>
        </div>
        <Button variant="outline" asChild>
          <a href={exportUrl} download>
            <Download className="h-4 w-4 mr-2" />
            Descargar CSV
          </a>
        </Button>
      </div>

      <form method="get" className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-mpd-gray absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, email o nickname..."
            className="pl-9"
          />
        </div>
        {params.stratum && <input type="hidden" name="stratum" value={params.stratum} />}
        {params.status && <input type="hidden" name="status" value={params.status} />}
        <Button type="submit" variant="outline">Buscar</Button>
        {q && (
          <Button type="button" variant="ghost" asChild>
            <Link href="/admin/users">Limpiar</Link>
          </Button>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mpd-border bg-mpd-black/30">
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Usuario</th>
                  <th className="text-left py-3 px-2 text-mpd-gray font-medium w-20">Rol</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Estado</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Rakeback Total</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Rakeback Mes</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Saldo</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Invertido</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Registro</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const rakebackMes = monthMap.get(u.id) ?? 0;
                  return (
                    <tr key={u.id} className="border-b border-mpd-border/30 hover:bg-mpd-surface-hover/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <Link
                              href={`/admin/users/${u.id}`}
                              className="text-mpd-white font-medium hover:text-mpd-gold transition-colors"
                            >
                              {u.name}
                            </Link>
                            <p className="text-xs text-mpd-gray truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant="outline" className="text-[10px]">{getRoleLabel(u.role)}</Badge>
                      </td>
                      <td className="py-3 px-4 text-center"><BadgeStratum stratum={u.stratum} /></td>
                      <td className="py-3 px-4 text-center"><BadgeStatus status={u.status} /></td>
                      <td className="py-3 px-4 text-right font-mono text-mpd-green">
                        {formatCurrency(toNum(u.totalRakeback))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-mpd-gold">
                        {rakebackMes > 0 ? formatCurrency(rakebackMes) : <span className="text-mpd-gray-dark">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-mpd-white">
                        {formatCurrency(toNum(u.availableBalance))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-mpd-amber">
                        {toNum(u.investedBalance) > 0 ? formatCurrency(toNum(u.investedBalance)) : <span className="text-mpd-gray-dark">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right text-mpd-gray">{formatDate(u.createdAt)}</td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/users/${u.id}`}>Ver</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-sm text-mpd-gray">
                      Sin resultados para esta búsqueda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-mpd-border">
              <p className="text-xs text-mpd-gray">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPageUrl(page - 1)}>Anterior</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={buildPageUrl(page + 1)}>Siguiente</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
