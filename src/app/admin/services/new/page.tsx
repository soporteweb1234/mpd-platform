import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NewServiceForm } from "@/components/admin/NewServiceForm";

export const metadata = { title: "Nuevo servicio — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminServiceNewPage() {
  await requireAdmin();
  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/services">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Nuevo servicio</h1>
        <p className="text-sm text-mpd-gray">
          Alta rápida con datos básicos. Edita después para ajustar features, recurrencia
          e instrucciones de setup.
        </p>
      </div>
      <Card>
        <CardContent className="p-4">
          <NewServiceForm />
        </CardContent>
      </Card>
    </div>
  );
}
