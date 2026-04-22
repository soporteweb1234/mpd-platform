import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewRoomForm } from "@/components/admin/NewRoomForm";

export const metadata = { title: "Nueva sala — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminRoomNewPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/rooms">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Nueva sala</h1>
        <p className="text-sm text-mpd-gray">
          Crea la sala con los datos básicos. Podrás ampliar el resto (logo, descripciones,
          VPN, requisitos) desde la edición.
        </p>
      </div>
      <Card>
        <CardContent className="p-4">
          <NewRoomForm />
        </CardContent>
      </Card>
    </div>
  );
}
