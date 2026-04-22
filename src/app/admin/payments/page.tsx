import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/guards";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { PaymentIntentsTable } from "@/components/admin/PaymentIntentsTable";

export const metadata = { title: "Pagos USDT — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  await requireAdmin();

  const intents = await prisma.paymentIntent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true } },
      webhookEvents: {
        orderBy: { receivedAt: "desc" },
        take: 3,
        select: {
          id: true,
          receivedAt: true,
          processed: true,
          processedAt: true,
          error: true,
        },
      },
    },
  });

  const serialized = intents.map((i) => ({
    id: i.id,
    provider: i.provider,
    providerOrderId: i.providerOrderId,
    amountUsd: i.amountUsd.toNumber(),
    network: i.network,
    payCurrency: i.payCurrency,
    payAddress: i.payAddress,
    payAmount: i.payAmount ? i.payAmount.toString() : null,
    status: i.status,
    creditedAt: i.creditedAt ? i.creditedAt.toISOString() : null,
    txHash: i.txHash,
    notes: i.notes,
    expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
    createdAt: i.createdAt.toISOString(),
    user: i.user,
    webhookEvents: i.webhookEvents.map((w) => ({
      id: w.id,
      receivedAt: w.receivedAt.toISOString(),
      processed: w.processed,
      processedAt: w.processedAt ? w.processedAt.toISOString() : null,
      error: w.error,
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Pagos USDT</h1>
          <p className="text-sm text-mpd-gray">
            {intents.length} {intents.length === 1 ? "intento" : "intentos"} (últimos 200)
          </p>
        </div>
      </div>

      {intents.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Wallet className="h-10 w-10 mx-auto text-mpd-gray mb-3" />
            <p className="text-sm text-mpd-gray">
              Aún no hay intentos de depósito. Los jugadores pueden iniciar uno
              desde <code>/dashboard/balance/deposit</code>.
            </p>
          </CardContent>
        </Card>
      ) : (
        <PaymentIntentsTable intents={serialized} />
      )}
    </div>
  );
}
