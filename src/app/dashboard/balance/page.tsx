import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatUSD, formatDateTime } from "@/lib/utils";
import { toNum } from "@/lib/money";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { BalanceAvailableCard } from "@/components/dashboard/BalanceAvailableCard";
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

const withdrawalStatusConfig: Record<
  string,
  { label: string; variant: "success" | "destructive" | "warning" | "secondary" }
> = {
  PENDING: { label: "En proceso", variant: "warning" },
  PAID: { label: "Paid", variant: "success" },
  REJECTED: { label: "Rejected", variant: "destructive" },
  EXPIRED: { label: "Expired", variant: "destructive" },
};

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

function formatWithdrawalDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function BalancePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const [user, transactions, withdrawals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { availableBalance: true, pendingBalance: true, lifetimeEarnings: true },
    }),
    prisma.balanceTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.withdrawalRequest.findMany({
      where: {
        userId: session.user.id,
        createdAt: { gte: threeMonthsAgo },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const availableBalance = toNum(user?.availableBalance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-mpd-white">Saldo Interno</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/balance/deposit">Depositar USDT</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/services">Canjear por servicios</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BalanceAvailableCard availableBalance={availableBalance} />
        <Card className="border-mpd-amber/30">
          <CardContent className="p-5">
            <p className="text-xs text-mpd-gray uppercase tracking-wider mb-1">Saldo Pendiente</p>
            <p className="text-3xl font-bold font-mono text-mpd-amber">{formatUSD(toNum(user?.pendingBalance))}</p>
            <p className="text-[10px] text-mpd-gray-dark mt-1">Se liquida en la próxima quincena</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-mpd-gray uppercase tracking-wider mb-1">Total Histórico</p>
            <p className="text-3xl font-bold font-mono text-mpd-white">{formatUSD(toNum(user?.lifetimeEarnings))}</p>
          </CardContent>
        </Card>
      </div>

      {/* Historial de retiros — últimos 3 meses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de retiros</CardTitle>
          <p className="text-xs text-mpd-gray-dark mt-0.5">Últimos 3 meses</p>
        </CardHeader>
        <CardContent>
          {withdrawals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-mpd-border">
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Cashout Date</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Date Paid</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Method</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Currency</th>
                    <th className="text-left py-3 px-2 text-mpd-gray font-medium">Payment Details</th>
                    <th className="text-right py-3 px-2 text-mpd-gray font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => {
                    const cfg = withdrawalStatusConfig[w.status] ?? {
                      label: w.status,
                      variant: "secondary" as const,
                    };
                    const showAmount = w.status === "PAID" ? toNum(w.amountUsd) : 0;
                    return (
                      <tr
                        key={w.id}
                        className="border-b border-mpd-border/50 hover:bg-mpd-surface-hover/50"
                      >
                        <td className="py-3 px-2">
                          <Badge variant={cfg.variant}>{cfg.label}</Badge>
                        </td>
                        <td className="py-3 px-2 text-mpd-white font-mono text-xs">
                          {formatWithdrawalDate(w.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-mpd-gray font-mono text-xs">
                          {w.status === "PAID"
                            ? formatWithdrawalDate(w.processedAt)
                            : "—"}
                        </td>
                        <td className="py-3 px-2 text-mpd-white">
                          Tether {w.network.toLowerCase()}
                        </td>
                        <td className="py-3 px-2 text-mpd-white">USDT</td>
                        <td
                          className="py-3 px-2 font-mono text-xs text-mpd-gray"
                          title={w.toAddress}
                        >
                          {truncateAddress(w.toAddress)}
                        </td>
                        <td className="py-3 px-2 text-right font-mono text-mpd-white">
                          {w.status === "PAID"
                            ? `₮${showAmount.toFixed(2)}`
                            : w.status === "PENDING"
                              ? `₮${toNum(w.amountUsd).toFixed(2)}`
                              : "0"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Sin retiros"
              description="Tu historial de retiros USDT aparecerá aquí."
            />
          )}
        </CardContent>
      </Card>

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
                      {tx.amount >= 0 ? "+" : ""}{formatUSD(tx.amount)}
                    </p>
                    <p className="text-xs text-mpd-gray-dark font-mono">{formatUSD(tx.balanceAfter)}</p>
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
