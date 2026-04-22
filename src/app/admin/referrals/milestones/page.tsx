import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ReferralMilestonesTable } from "@/components/admin/ReferralMilestonesTable";

export const metadata = { title: "Milestones referidos — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminMilestonesPage() {
  await requireAdmin();

  const milestones = await prisma.referralMilestone.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { awards: true } } },
  });

  const serialized = milestones.map((m) => ({
    id: m.id,
    code: m.code,
    label: m.label,
    description: m.description,
    threshold: m.threshold.toNumber(),
    metric: m.metric,
    bonusAmount: m.bonusAmount.toNumber(),
    active: m.active,
    awardCount: m._count.awards,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/referrals">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Referidos
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Milestones de referidos</h1>
        <p className="text-sm text-mpd-gray">
          Bonos one-time al referrer cuando su referido alcanza hitos lifetime.
        </p>
      </div>

      {serialized.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Target className="h-10 w-10 mx-auto text-mpd-gray mb-3" />
            <p className="text-sm text-mpd-gray">
              Sin milestones todavía. Crea el primero (ej. “first_100_rb” → $10).
            </p>
          </CardContent>
        </Card>
      ) : null}

      <ReferralMilestonesTable milestones={serialized} />
    </div>
  );
}
