"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { refreshIntentStatus } from "@/lib/actions/payments";
import type { PaymentIntentStatus, PaymentProvider } from "@prisma/client";

export type AdminPaymentIntent = {
  id: string;
  provider: PaymentProvider;
  providerOrderId: string;
  amountUsd: number;
  network: string;
  payCurrency: string;
  payAddress: string | null;
  payAmount: string | null;
  status: PaymentIntentStatus;
  creditedAt: string | null;
  txHash: string | null;
  notes: string | null;
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
  webhookEvents: Array<{
    id: string;
    receivedAt: string;
    processed: boolean;
    processedAt: string | null;
    error: string | null;
  }>;
};

const STATUS_LABEL: Record<PaymentIntentStatus, string> = {
  WAITING: "Esperando",
  CONFIRMING: "Confirmando",
  CONFIRMED: "Confirmado",
  FINISHED: "Acreditado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  EXPIRED: "Expirado",
};

const STATUS_VARIANT: Record<
  PaymentIntentStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  WAITING: "warning",
  CONFIRMING: "secondary",
  CONFIRMED: "secondary",
  FINISHED: "success",
  FAILED: "destructive",
  REFUNDED: "outline",
  EXPIRED: "outline",
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function PaymentIntentsTable({
  intents,
}: {
  intents: AdminPaymentIntent[];
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState<"" | PaymentIntentStatus>("");
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const filtered = intents.filter(
    (i) => !statusFilter || i.status === statusFilter,
  );

  async function onRefresh(id: string) {
    setPendingId(id);
    try {
      const res = await refreshIntentStatus(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Estado: ${res.status}`);
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "" | PaymentIntentStatus)
          }
          className="h-9 rounded-lg border border-mpd-border bg-mpd-surface px-2 text-xs text-mpd-white focus:border-mpd-gold focus:outline-none"
        >
          <option value="">Todos</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <span className="text-xs text-mpd-gray">
          {filtered.length} / {intents.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/40">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Jugador</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Importe</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Red</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Estado</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Provider ID</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">TX hash</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Creado</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <React.Fragment key={i.id}>
                <tr className="border-b border-mpd-border/30">
                  <td className="py-2 px-3">
                    <p className="text-mpd-white font-medium">
                      {i.user?.name ?? i.user?.email ?? "—"}
                    </p>
                    {i.user?.name && (
                      <p className="text-[11px] text-mpd-gray">{i.user.email}</p>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-mpd-white">
                    {fmtMoney(i.amountUsd)}
                  </td>
                  <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                    {i.network}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant={STATUS_VARIANT[i.status]} className="text-[10px]">
                      {STATUS_LABEL[i.status]}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-[11px] font-mono text-mpd-gray truncate max-w-[140px]">
                    {i.providerOrderId}
                  </td>
                  <td className="py-2 px-3 text-[11px] font-mono text-mpd-gray truncate max-w-[160px]">
                    {i.txHash ?? "—"}
                  </td>
                  <td className="py-2 px-3 text-xs text-mpd-gray font-mono">
                    {format(new Date(i.createdAt), "dd/MM HH:mm", { locale: es })}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingId === i.id}
                        onClick={() => onRefresh(i.id)}
                        aria-label="Refrescar estado"
                        title="Refrescar estado"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setExpandedId(expandedId === i.id ? null : i.id)
                        }
                      >
                        {expandedId === i.id ? "Cerrar" : "Ver"}
                      </Button>
                    </div>
                  </td>
                </tr>
                {expandedId === i.id && (
                  <tr className="border-b border-mpd-border/30 bg-mpd-black/20">
                    <td colSpan={8} className="py-3 px-3 text-xs text-mpd-gray">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-mpd-gray mb-1">
                            Dirección
                          </p>
                          <p className="font-mono break-all">
                            {i.payAddress ?? "—"}
                          </p>
                          <p className="text-[10px] uppercase tracking-wide text-mpd-gray mt-2 mb-1">
                            Pay amount / currency
                          </p>
                          <p className="font-mono">
                            {i.payAmount ?? "—"} {i.payCurrency || ""}
                          </p>
                          {i.notes && (
                            <>
                              <p className="text-[10px] uppercase tracking-wide text-mpd-gray mt-2 mb-1">
                                Notas
                              </p>
                              <p className="whitespace-pre-wrap">{i.notes}</p>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-mpd-gray mb-1">
                            Últimos webhooks ({i.webhookEvents.length})
                          </p>
                          <ul className="space-y-1">
                            {i.webhookEvents.map((w) => (
                              <li
                                key={w.id}
                                className="border border-mpd-border/40 rounded px-2 py-1"
                              >
                                <span className="font-mono">
                                  {format(
                                    new Date(w.receivedAt),
                                    "dd/MM HH:mm:ss",
                                    { locale: es },
                                  )}
                                </span>{" "}
                                ·{" "}
                                {w.processed ? (
                                  <span className="text-mpd-green">OK</span>
                                ) : w.error ? (
                                  <span className="text-mpd-amber">
                                    {w.error.slice(0, 80)}
                                  </span>
                                ) : (
                                  <span className="text-mpd-gray">pendiente</span>
                                )}
                              </li>
                            ))}
                            {i.webhookEvents.length === 0 && (
                              <li className="text-mpd-gray">Sin webhooks aún</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 px-3 text-center text-xs text-mpd-gray"
                >
                  Sin resultados con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
