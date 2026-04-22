import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReferralFraudTable } from "@/components/admin/ReferralFraudTable";

export const metadata = { title: "Fraude referidos — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFraudPage() {
  await requireAdmin();

  const rows = await prisma.referralFraudFlag.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  const serialized = rows.map((r) => ({
    id: r.id,
    user: r.user ? { id: r.user.id, label: r.user.name ?? r.user.email } : null,
    reason: r.reason,
    severity: r.severity,
    evidence: r.evidence,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/referrals">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Referidos
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Flags de fraude</h1>
        <p className="text-sm text-mpd-gray">
          Revisiones pendientes del scanner antifraude. Resolver libera/rechaza
          las attributions retenidas del usuario.
        </p>
      </div>

      {serialized.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <ShieldAlert className="h-10 w-10 mx-auto text-mpd-gray mb-3" />
            <p className="text-sm text-mpd-gray">Sin flags abiertos. Todo limpio.</p>
          </CardContent>
        </Card>
      ) : (
        <ReferralFraudTable flags={serialized} />
      )}
    </div>
  );
}
