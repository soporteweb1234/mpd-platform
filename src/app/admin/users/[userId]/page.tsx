import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, getInitials, getRoleLabel, getStratumLabel } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, Wallet, Users, Calendar, Mail, Globe, Gamepad2 } from "lucide-react";

export const metadata = { title: "Perfil de Usuario — Admin" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referrals: { where: { deletedAt: null }, select: { id: true } },
      referredBy: { select: { name: true, email: true } },
      roomAffiliations: { include: { room: { select: { name: true } } } },
      _count: {
        select: {
          rakebackRecords: true,
          balanceTransactions: true,
          serviceOrders: true,
          courseEnrollments: true,
          supportTickets: true,
        },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-mpd-white">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <BadgeStratum stratum={user.stratum} />
              <Badge variant="outline">{getRoleLabel(user.role)}</Badge>
              <BadgeStatus status={user.status} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-mpd-gray mb-1">Rakeback Total</p>
            <p className="text-xl font-bold font-mono text-mpd-gold">{formatCurrency(user.totalRakeback.toNumber())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-mpd-gray mb-1">Saldo Disponible</p>
            <p className="text-xl font-bold font-mono text-mpd-green">{formatCurrency(user.availableBalance.toNumber())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-mpd-gray mb-1">Saldo Pendiente</p>
            <p className="text-xl font-bold font-mono text-mpd-amber">{formatCurrency(user.pendingBalance.toNumber())}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-mpd-gray mb-1">Referidos</p>
            <p className="text-xl font-bold font-mono text-mpd-white">{user.referrals.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Información Personal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-mpd-gray" />
              <span className="text-mpd-gray">Email:</span>
              <span className="text-mpd-white">{user.email}</span>
            </div>
            {user.nickname && (
              <div className="flex items-center gap-2 text-sm">
                <Gamepad2 className="h-4 w-4 text-mpd-gray" />
                <span className="text-mpd-gray">Nickname:</span>
                <span className="text-mpd-white">{user.nickname}</span>
              </div>
            )}
            {user.country && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-mpd-gray" />
                <span className="text-mpd-gray">País:</span>
                <span className="text-mpd-white">{user.country}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-mpd-gray" />
              <span className="text-mpd-gray">Registro:</span>
              <span className="text-mpd-white">{formatDate(user.createdAt)}</span>
            </div>
            {user.playingLevel && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-mpd-gray" />
                <span className="text-mpd-gray">Nivel:</span>
                <span className="text-mpd-white">{user.playingLevel}</span>
              </div>
            )}
            {user.referredBy && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-mpd-gray" />
                <span className="text-mpd-gray">Referido por:</span>
                <span className="text-mpd-white">{user.referredBy.name}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Salas Afiliadas</CardTitle></CardHeader>
          <CardContent>
            {user.roomAffiliations.length > 0 ? (
              <div className="space-y-2">
                {user.roomAffiliations.map((aff) => (
                  <div key={aff.id} className="flex items-center justify-between py-2 border-b border-mpd-border/30 last:border-0">
                    <span className="text-sm text-mpd-white">{aff.room.name}</span>
                    <div className="flex items-center gap-2">
                      {aff.isPrimary && <Badge>Principal</Badge>}
                      <Badge variant={aff.verified ? "success" : "warning"}>
                        {aff.verified ? "Verificada" : "Pendiente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-mpd-gray">Sin salas afiliadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <Link href={`/admin/users/${userId}/rakeback`}>Cargar Rakeback</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/admin/users/${userId}/balance`}>Ajustar Saldo</Link>
        </Button>
      </div>
    </div>
  );
}
