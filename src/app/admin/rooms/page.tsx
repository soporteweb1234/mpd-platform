import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, Globe, Shield } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Salas — Admin" };

export default async function AdminRoomsPage() {
  const rooms = await prisma.pokerRoom.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { affiliations: true, rakebackRecords: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Salas de Poker</h1>
        <Button asChild>
          <Link href="/admin/rooms/new">
            <Plus className="h-4 w-4 mr-1" /> Nueva Sala
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => (
          <Card key={room.id} className="hover:border-mpd-border-light transition-colors">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-mpd-gold" />
                  </div>
                  <div>
                    <h3 className="font-medium text-mpd-white">{room.name}</h3>
                    <p className="text-xs text-mpd-gray">Código: {room.affiliateCode}</p>
                  </div>
                </div>
                <Badge variant={room.status === "ACTIVE" ? "success" : "secondary"}>
                  {room.status === "ACTIVE" ? "Activa" : room.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <span className="text-mpd-gray">Rakeback base:</span>
                  <span className="text-mpd-white ml-1 font-mono">{room.rakebackBase}%</span>
                </div>
                <div>
                  <span className="text-mpd-gray">Jugadores:</span>
                  <span className="text-mpd-white ml-1 font-mono">{room._count.affiliations}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                {room.vpnRequired && (
                  <Badge variant="warning" className="text-[10px]">
                    <Shield className="h-3 w-3 mr-1" /> VPN
                  </Badge>
                )}
                {room.website && (
                  <Badge variant="outline" className="text-[10px]">
                    <Globe className="h-3 w-3 mr-1" /> Web
                  </Badge>
                )}
              </div>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/admin/rooms/${room.id}`}>Editar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
