import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoomEditForm } from "@/components/admin/RoomEditForm";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Editar sala — Admin" };

export default async function AdminRoomEditPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await prisma.pokerRoom.findUnique({ where: { id: roomId } });
  if (!room) notFound();

  const affiliationsCount = await prisma.roomAffiliation.count({
    where: { roomId: room.id },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/rooms">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">{room.name}</h1>
          <p className="text-sm text-mpd-gray">
            {affiliationsCount} jugadores afiliados · slug <span className="font-mono">{room.slug}</span>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración de la sala</CardTitle>
        </CardHeader>
        <CardContent>
          <RoomEditForm
            room={{
              id: room.id,
              name: room.name,
              slug: room.slug,
              affiliateCode: room.affiliateCode,
              rakebackBase: room.rakebackBase,
              rakebackPremium: room.rakebackPremium,
              logo: room.logo,
              website: room.website,
              shortDescription: room.shortDescription,
              longDescription: room.longDescription,
              description: room.description,
              setupGuide: room.setupGuide,
              registrationCode: room.registrationCode,
              master: room.master,
              dealCurrent: room.dealCurrent,
              dealMax: room.dealMax,
              rating: room.rating,
              vpnRequired: room.vpnRequired,
              vpnInstructions: room.vpnInstructions,
              requiresRenting: room.requiresRenting,
              noKyc: room.noKyc,
              status: room.status,
              sortOrder: room.sortOrder,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
