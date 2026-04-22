import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ReferralCommissionForm } from "@/components/admin/ReferralCommissionForm";
import { ReferralCommissionRowActions } from "@/components/admin/ReferralCommissionRowActions";

export const metadata = { title: "Detalle referrer — Admin" };

export default async function AdminReferrerDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const referrer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      referralCode: true,
      referrals: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          roomAffiliations: {
            select: {
              id: true,
              room: { select: { id: true, name: true } },
              referralCodeAtRoom: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!referrer) notFound();

  const commissions = await prisma.referralCommission.findMany({
    where: { referrerId: userId },
    include: {
      referred: { select: { id: true, name: true, email: true } },
      room: { select: { id: true, name: true } },
    },
    orderBy: [{ active: "desc" }, { periodStart: "desc" }],
  });

  const rooms = await prisma.pokerRoom.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { sortOrder: "asc" },
  });

  const referredOptions = referrer.referrals.map((r) => ({
    id: r.id,
    name: r.name ?? r.email,
    email: r.email,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/referrals">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">
            {referrer.name ?? referrer.email}
          </h1>
          <p className="text-sm text-mpd-gray">
            {referrer.email} · código{" "}
            <Badge variant="outline" className="font-mono text-[10px]">
              {referrer.referralCode}
            </Badge>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Cadena de referidos ({referrer.referrals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referrer.referrals.length === 0 ? (
            <p className="text-sm text-mpd-gray py-6 text-center">
              Este usuario no ha traído a nadie todavía.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border bg-mpd-black/30">
                    <th className="text-left py-2 px-3 text-mpd-gray font-medium">
                      Jugador
                    </th>
                    <th className="text-left py-2 px-3 text-mpd-gray font-medium">Salas</th>
                    <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                      Se registró
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {referrer.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-mpd-border/30">
                      <td className="py-2 px-3">
                        <p className="text-mpd-white">{r.name ?? r.email}</p>
                        <p className="text-[11px] text-mpd-gray">{r.email}</p>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1">
                          {r.roomAffiliations.length === 0 && (
                            <span className="text-[11px] text-mpd-gray">
                              Sin afiliaciones
                            </span>
                          )}
                          {r.roomAffiliations.map((a) => (
                            <Badge key={a.id} variant="secondary" className="text-[10px]">
                              {a.room.name}
                              {a.referralCodeAtRoom ? ` · ${a.referralCodeAtRoom}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right text-xs text-mpd-gray">
                        {new Date(r.createdAt).toLocaleDateString("es-ES")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comisiones personalizadas ({commissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {commissions.length === 0 ? (
            <p className="text-sm text-mpd-gray py-4 text-center">
              Sin overrides. Por defecto se aplica la comisión estándar de la sala.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border bg-mpd-black/30">
                    <th className="text-left py-2 px-3 text-mpd-gray font-medium">
                      Referido
                    </th>
                    <th className="text-left py-2 px-3 text-mpd-gray font-medium">Sala</th>
                    <th className="text-right py-2 px-3 text-mpd-gray font-medium">%</th>
                    <th className="text-center py-2 px-3 text-mpd-gray font-medium">
                      Vigencia
                    </th>
                    <th className="text-center py-2 px-3 text-mpd-gray font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-mpd-border/30">
                      <td className="py-2 px-3">
                        <p className="text-mpd-white">
                          {c.referred.name ?? c.referred.email}
                        </p>
                        <p className="text-[11px] text-mpd-gray">{c.referred.email}</p>
                      </td>
                      <td className="py-2 px-3 text-mpd-white">{c.room.name}</td>
                      <td className="py-2 px-3 text-right font-mono text-mpd-white">
                        {Number(c.commissionPercent).toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                        {new Date(c.periodStart).toLocaleDateString("es-ES")}
                        {c.periodEnd
                          ? ` → ${new Date(c.periodEnd).toLocaleDateString("es-ES")}`
                          : " → ∞"}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant={c.active ? "success" : "secondary"}
                            className="text-[10px]"
                          >
                            {c.active ? "Activa" : "Inactiva"}
                          </Badge>
                          <ReferralCommissionRowActions
                            id={c.id}
                            active={c.active}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-mpd-white mb-2">Nueva comisión</h3>
            {referredOptions.length === 0 ? (
              <p className="text-xs text-mpd-gray">
                No puedes crear una comisión custom: este usuario todavía no tiene
                referidos vinculados.
              </p>
            ) : rooms.length === 0 ? (
              <p className="text-xs text-mpd-gray">
                No hay salas activas donde aplicar una comisión.
              </p>
            ) : (
              <ReferralCommissionForm
                referrerId={referrer.id}
                referredUsers={referredOptions}
                rooms={rooms}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
