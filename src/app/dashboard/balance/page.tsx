import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import Link from "next/link";

export const metadata = { title: "Saldo Interno" };

const typeLabels: Record<string, string> = {
  RAKEBACK_CREDIT: "Rakeback",
  SERVICE_PURCHASE: "Servicio",
  COURSE_PURCHASE: "Curso",
  REFERRAL_COMMISSION: "Comisión referido",
  STAKING_PROFIT: "Bancaje (ganancia)",
  STAKING_LOSS: "Bancaje (pérdida)",
  MANUAL_ADJUSTMENT: "Ajuste manual",
  WITHDRAWAL: "Retiro",
  BONUS: "Bonus",
  POINTS_REWARD: "Recompensa puntos",
};

export default async function BalancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { availableBalance: true, pendingBalance: true, lifetimeEarnings: true },
  });

  const transactions = await prisma.balanceTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Saldo Interno</h1>
        <Button asChild>
          <Link href="/dashboard/services">Canjear por servicios</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-mpd-green/30">
          <CardContent className="p-5">
            <p className="text-xs text-mpd-gray uppercase tracking-wider mb-1">Saldo Disponible</p>
            <p className="text-3xl font-bold font-mono text-mpd-green">{formatCurrency(user?.availableBalance ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-mpd-amber/30">
          <CardContent className="p-5">
            <p className="text-xs text-mpd-gray uppercase tracking-wider mb-1">Saldo Pendiente</p>
            <p className="text-3xl font-bold font-mono text-mpd-amber">{formatCurrency(user?.pendingBalance ?? 0)}</p>
            <p className="text-[10px] text-mpd-gray-dark mt-1">Se liquida en la próxima quincena</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-mpd-gray uppercase tracking-wider mb-1">Total Histórico</p>
            <p className="text-3xl font-bold font-mono text-mpd-white">{formatCurrency(user?.lifetimeEarnings ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-mpd-surface-hover/50 border-b border-mpd-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tx.amount >= 0 ? "bg-mpd-green/10" : "bg-mpd-red/10"}`}>
                      {tx.amount >= 0 ? (
                        <ArrowUpRight className="h-4 w-4 text-mpd-green" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-mpd-red" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-mpd-white">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-mpd-gray-dark">{formatDateTime(tx.createdAt)}</span>
                        <span className="text-xs text-mpd-gray">{typeLabels[tx.type] ?? tx.type}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-mono font-medium ${tx.amount >= 0 ? "text-mpd-green" : "text-mpd-red"}`}>
                      {tx.amount >= 0 ? "+" : ""}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-mpd-gray-dark font-mono">{formatCurrency(tx.balanceAfter)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Sin transacciones"
              description="Tus movimientos de saldo aparecerán aquí."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
