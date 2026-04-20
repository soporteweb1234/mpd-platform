import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { formatCurrency, formatDate, getRoleLabel } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Usuarios — Admin" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; stratum?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1");
  const perPage = 20;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = { deletedAt: null };
  if (params.stratum) where.stratum = params.stratum;
  if (params.status) where.status = params.status;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
      { nickname: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: perPage,
      skip,
      select: {
        id: true, name: true, email: true, nickname: true, avatar: true,
        role: true, stratum: true, status: true, totalRakeback: true,
        availableBalance: true, createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Usuarios</h1>
          <p className="text-sm text-mpd-gray">{total} usuarios registrados</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mpd-border bg-mpd-black/30">
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Jugador</th>
                  <th className="text-left py-3 px-4 text-mpd-gray font-medium">Rol</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Estrato</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Estado</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Rakeback</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Saldo</th>
                  <th className="text-right py-3 px-4 text-mpd-gray font-medium">Registro</th>
                  <th className="text-center py-3 px-4 text-mpd-gray font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-mpd-border/30 hover:bg-mpd-surface-hover/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-mpd-white font-medium">{u.name}</p>
                          <p className="text-xs text-mpd-gray">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[10px]">{getRoleLabel(u.role)}</Badge>
                    </td>
                    <td className="py-3 px-4 text-center"><BadgeStratum stratum={u.stratum} /></td>
                    <td className="py-3 px-4 text-center"><BadgeStatus status={u.status} /></td>
                    <td className="py-3 px-4 text-right font-mono text-mpd-green">{formatCurrency(u.totalRakeback.toNumber())}</td>
                    <td className="py-3 px-4 text-right font-mono text-mpd-white">{formatCurrency(u.availableBalance.toNumber())}</td>
                    <td className="py-3 px-4 text-right text-mpd-gray">{formatDate(u.createdAt)}</td>
                    <td className="py-3 px-4 text-center">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/users/${u.id}`}>Ver</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-mpd-border">
              <p className="text-xs text-mpd-gray">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/users?page=${page - 1}`}>Anterior</Link>
                  </Button>
                )}
                {page < totalPages && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/users?page=${page + 1}`}>Siguiente</Link>
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
