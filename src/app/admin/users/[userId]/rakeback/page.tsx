import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadRakebackForm } from "@/components/admin/LoadRakebackForm";

export const metadata = { title: "Cargar rakeback — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUserRakebackPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;

  const [user, rooms] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        nickname: true,
        totalRakeback: true,
        availableBalance: true,
      },
    }),
    prisma.pokerRoom.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/users/${userId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al usuario
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Cargar rakeback</h1>
        <p className="text-sm text-mpd-gray font-mono">{user.email}</p>
        <p className="text-xs text-mpd-gray mt-1">
          Total acumulado: $
          {user.totalRakeback.toNumber().toFixed(2)} · Disponible: $
          {user.availableBalance.toNumber().toFixed(2)}
        </p>
      </div>
      <Card>
        <CardContent className="p-4">
          <LoadRakebackForm
            userId={userId}
            rooms={rooms}
          />
        </CardContent>
      </Card>
    </div>
  );
}
