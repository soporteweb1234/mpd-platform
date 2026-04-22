import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { ReferralAttributionsAdminTable } from "@/components/admin/ReferralAttributionsAdminTable";

export const metadata = { title: "Attributions referidos — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAttributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const status = sp.status;

  const validStatuses = ["PENDING", "AVAILABLE", "HELD", "REJECTED", "REVERSED"];
  const where = status && validStatuses.includes(status)
    ? { status: status as "PENDING" | "AVAILABLE" | "HELD" | "REJECTED" | "REVERSED" }
    : {};

  const rows = await prisma.referralAttribution.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      referrer: { select: { id: true, name: true, email: true } },
      referred: { select: { id: true, name: true, email: true } },
    },
  });

  const serialized = rows.map((r) => ({
    id: r.id,
    referrer: r.referrer
      ? { id: r.referrer.id, label: r.referrer.name ?? r.referrer.email }
      : null,
    referred: r.referred
      ? { id: r.referred.id, label: r.referred.name ?? r.referred.email }
      : null,
    level: r.level,
    sourceAmount: r.sourceAmount.toNumber(),
    commissionPct: r.commissionPct.toNumber(),
    amount: r.amount.toNumber(),
    status: r.status,
    maturedAt: r.maturedAt ? r.maturedAt.toISOString() : null,
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
    flaggedReason: r.flaggedReason,
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
        <h1 className="text-2xl font-bold text-mpd-white">Attributions (splits auto)</h1>
        <p className="text-sm text-mpd-gray">
          Ledger de comisiones generadas automáticamente al acreditar rakeback. Admin puede
          liberar HELD o marcar fraude.
        </p>
      </div>
      <ReferralAttributionsAdminTable attributions={serialized} currentStatus={status ?? ""} />
    </div>
  );
}
