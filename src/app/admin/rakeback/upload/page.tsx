import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RakebackCsvUpload } from "@/components/admin/RakebackCsvUpload";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Carga CSV Rakeback — Admin" };

export default async function AdminRakebackUploadPage() {
  const [users, rooms] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null, status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.pokerRoom.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, slug: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/rakeback">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Carga CSV de Rakeback</h1>
          <p className="text-sm text-mpd-gray">
            Sube un CSV con múltiples filas. Cada fila se previsualiza y confirma individualmente —
            no existe carga ciega por diseño.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Importador</CardTitle>
        </CardHeader>
        <CardContent>
          <RakebackCsvUpload users={users} rooms={rooms} />
        </CardContent>
      </Card>
    </div>
  );
}
