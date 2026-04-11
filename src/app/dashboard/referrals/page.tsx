import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataCard } from "@/components/shared/DataCard";
import { BadgeStratum } from "@/components/shared/BadgeStratum";
import { BadgeStatus } from "@/components/shared/BadgeStatus";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { Users, Copy, Link2, Gift } from "lucide-react";
import { CopyReferralCode } from "@/components/shared/CopyReferralCode";

export const metadata = { title: "Referidos" };

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      referrals: {
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          nickname: true,
          stratum: true,
          status: true,
          createdAt: true,
          totalRakeback: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const totalReferrals = user?.referrals.length ?? 0;
  const activeReferrals = user?.referrals.filter((r) => r.status === "ACTIVE").length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Referidos</h1>

      {/* Referral Code */}
      <Card className="border-mpd-gold/20">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-medium text-mpd-white mb-1">Tu código de referido</h3>
              <p className="text-xs text-mpd-gray">Comparte tu enlace y gana meses de servicios VIP, % creciente del rakeback extra de tu referido, y prestigio en la comunidad</p>
            </div>
            <CopyReferralCode code={user?.referralCode ?? ""} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DataCard
          title="Total Referidos"
          value={totalReferrals}
          icon={<Users className="h-5 w-5" />}
          color="white"
        />
        <DataCard
          title="Referidos Activos"
          value={activeReferrals}
          icon={<Gift className="h-5 w-5" />}
          color="green"
        />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-medium text-mpd-white mb-2">Ventajas del programa de referidos</h3>
          <ul className="space-y-2 text-sm text-mpd-gray">
            <li className="flex items-start gap-2">
              <span className="text-mpd-gold mt-0.5">•</span>
              <span>Gana meses de servicios VIP por cada referido activo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mpd-gold mt-0.5">•</span>
              <span>Porcentaje creciente del rakeback extra generado por tu referido</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-mpd-gold mt-0.5">•</span>
              <span>Gestiona grupos de enseñanza, adquiere galones y prestigio en la comunidad</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis Referidos</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.referrals && user.referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border">
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Jugador</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Registro</th>
                    <th className="text-center py-3 px-2 text-mpd-gray font-medium">Estrato</th>
                    <th className="text-center py-3 px-2 text-mpd-gray font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {user.referrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-mpd-border/50 hover:bg-mpd-surface-hover/50">
                      <td className="py-3 px-2 text-mpd-white">{ref.nickname ?? ref.name}</td>
                      <td className="py-3 px-2 text-mpd-gray">{formatDate(ref.createdAt)}</td>
                      <td className="py-3 px-2 text-center"><BadgeStratum stratum={ref.stratum} /></td>
                      <td className="py-3 px-2 text-center"><BadgeStatus status={ref.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin referidos"
              description="Comparte tu código y empieza a ganar comisiones."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
