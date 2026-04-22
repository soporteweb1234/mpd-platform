import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdjustBalanceForm } from "@/components/admin/AdjustBalanceForm";

export const metadata = { title: "Ajustar saldo — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUserBalancePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdmin();
  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      availableBalance: true,
      pendingBalance: true,
      totalRakeback: true,
      investedBalance: true,
    },
  });
  if (!user) notFound();

  return (
    <div className="space-y-6 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/users/${userId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver al usuario
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Ajustar saldo</h1>
        <p className="text-sm text-mpd-gray font-mono">{user.email}</p>
      </div>
      <Card>
        <CardContent className="p-4">
          <AdjustBalanceForm
            userId={userId}
            current={{
              availableBalance: user.availableBalance.toNumber(),
              pendingBalance: user.pendingBalance.toNumber(),
              totalRakeback: user.totalRakeback.toNumber(),
              investedBalance: user.investedBalance.toNumber(),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
