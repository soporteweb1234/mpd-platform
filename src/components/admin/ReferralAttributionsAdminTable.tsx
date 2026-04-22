"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  markAttributionOk,
  markAttributionFraud,
} from "@/lib/actions/admin-referral-review";

type Row = {
  id: string;
  referrer: { id: string; label: string } | null;
  referred: { id: string; label: string } | null;
  level: number;
  sourceAmount: number;
  commissionPct: number;
  amount: number;
  status: "PENDING" | "AVAILABLE" | "HELD" | "REJECTED" | "REVERSED";
  maturedAt: string | null;
  paidAt: string | null;
  flaggedReason: string | null;
  createdAt: string;
};

const STATUS_LABEL: Record<Row["status"], string> = {
  PENDING: "Pending",
  AVAILABLE: "Available",
  HELD: "Held",
  REJECTED: "Rejected",
  REVERSED: "Reversed",
};
const STATUS_VARIANT: Record<
  Row["status"],
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  PENDING: "warning",
  AVAILABLE: "success",
  HELD: "secondary",
  REJECTED: "destructive",
  REVERSED: "outline",
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function ReferralAttributionsAdminTable({
  attributions,
  currentStatus,
}: {
  attributions: Row[];
  currentStatus: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onOk(id: string) {
    if (!confirm("¿Liberar esta comisión al referrer?")) return;
    setPendingId(id);
    try {
      const res = await markAttributionOk(id);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Liberada");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  async function onFraud(id: string) {
    const reason = prompt("Motivo (opcional):") ?? undefined;
    if (!confirm("¿Marcar como fraude? No se pagará.")) return;
    setPendingId(id);
    try {
      const res = await markAttributionFraud(id, reason);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Marcada como fraude");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {["", "PENDING", "HELD", "AVAILABLE", "REJECTED"].map((s) => (
          <Button
            key={s || "all"}
            variant={currentStatus === s ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link
              href={`/admin/referrals/attributions${s ? `?status=${s}` : ""}`}
            >
              {s || "Todos"}
            </Link>
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/40">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Referrer</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Referido</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Nivel</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Source</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">%</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Monto</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Estado</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Vence</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {attributions.map((a) => (
              <tr key={a.id} className="border-b border-mpd-border/30">
                <td className="py-2 px-3 text-xs text-mpd-white">
                  {a.referrer?.label ?? "—"}
                </td>
                <td className="py-2 px-3 text-xs text-mpd-white">
                  {a.referred?.label ?? "—"}
                </td>
                <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                  L{a.level}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs text-mpd-gray">
                  {fmtMoney(a.sourceAmount)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-xs text-mpd-gray">
                  {a.commissionPct.toFixed(2)}%
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-green">
                  {fmtMoney(a.amount)}
                </td>
                <td className="py-2 px-3 text-center">
                  <Badge variant={STATUS_VARIANT[a.status]} className="text-[10px]">
                    {STATUS_LABEL[a.status]}
                  </Badge>
                  {a.flaggedReason && (
                    <p className="text-[10px] text-mpd-amber mt-0.5">{a.flaggedReason}</p>
                  )}
                </td>
                <td className="py-2 px-3 text-xs text-mpd-gray font-mono">
                  {a.maturedAt
                    ? format(new Date(a.maturedAt), "dd/MM HH:mm", { locale: es })
                    : "—"}
                </td>
                <td className="py-2 px-3 text-right">
                  {(a.status === "PENDING" || a.status === "HELD") && (
                    <div className="inline-flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingId === a.id}
                        onClick={() => onOk(a.id)}
                        aria-label="Liberar"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingId === a.id}
                        onClick={() => onFraud(a.id)}
                        aria-label="Fraude"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {attributions.length === 0 && (
              <tr>
                <td colSpan={9} className="py-6 px-3 text-center text-xs text-mpd-gray">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
