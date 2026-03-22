import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Building2, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Mis Salas" };

export default async function RoomsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const affiliations = await prisma.roomAffiliation.findMany({
    where: { userId: session.user.id },
    include: { room: true },
    orderBy: { createdAt: "desc" },
  });

  const affiliatedRoomIds = affiliations.map((a) => a.roomId);
  const availableRooms = await prisma.pokerRoom.findMany({
    where: {
      id: { notIn: affiliatedRoomIds },
      status: "ACTIVE",
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-mpd-white">Mis Salas</h1>

      {affiliations.length > 0 && (
        <div>
          <SectionHeading title="Salas Afiliadas" subtitle="Salas donde estás registrado con MPD" className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {affiliations.map((aff) => (
              <Card key={aff.id} className="hover:border-mpd-border-light transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-mpd-gold" />
                      </div>
                      <div>
                        <h3 className="font-medium text-mpd-white">{aff.room.name}</h3>
                        <p className="text-xs text-mpd-gray">Rakeback: {aff.room.rakebackBase}%</p>
                      </div>
                    </div>
                    {aff.isPrimary && <Badge variant="default">Principal</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    {aff.verified ? (
                      <div className="flex items-center gap-1 text-xs text-mpd-green">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verificada
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-mpd-amber">
                        <Clock className="h-3.5 w-3.5" />
                        Pendiente de verificación
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/rooms/${aff.room.slug}`}>Ver detalle</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {availableRooms.length > 0 && (
        <div>
          <SectionHeading title="Salas Disponibles" subtitle="Regístrate con nuestro código de afiliación" className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRooms.map((room) => (
              <Card key={room.id} className="hover:border-mpd-gold/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-mpd-surface-hover flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-mpd-gray" />
                    </div>
                    <div>
                      <h3 className="font-medium text-mpd-white">{room.name}</h3>
                      <p className="text-xs text-mpd-gray">Rakeback base: {room.rakebackBase}%</p>
                    </div>
                  </div>
                  {room.description && (
                    <p className="text-xs text-mpd-gray mb-3 line-clamp-2">{room.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {room.vpnRequired && <Badge variant="warning">Requiere VPN</Badge>}
                  </div>
                  <Button size="sm" className="w-full mt-3" asChild>
                    <Link href={`/dashboard/rooms/${room.slug}`}>Darme de alta</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
