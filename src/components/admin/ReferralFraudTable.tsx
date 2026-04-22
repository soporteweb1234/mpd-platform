"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { resolveFraudFlag } from "@/lib/actions/admin-referral-review";

type FraudRow = {
  id: string;
  user: { id: string; label: string } | null;
  reason: string;
  severity: string;
  evidence: unknown;
  createdAt: string;
};

const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  LOW: "outline",
  MEDIUM: "warning",
  HIGH: "destructive",
};

export function ReferralFraudTable({ flags }: { flags: FraudRow[] }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  async function onResolve(id: string, decision: "OK" | "FRAUD") {
    const notes = prompt("Notas (opcional):") ?? "";
    if (
      !confirm(
        decision === "OK"
          ? "¿Liberar attributions HELD del usuario?"
          : "¿Confirmar fraude? Todas las attributions pendientes serán rechazadas.",
      )
    ) {
      return;
    }
    setPendingId(id);
    try {
      const res = await resolveFraudFlag(id, { decision, notes });
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Flag resuelto");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mpd-border bg-mpd-black/40">
            <th className="text-left py-2 px-3 text-mpd-gray font-medium">Usuario</th>
            <th className="text-left py-2 px-3 text-mpd-gray font-medium">Razón</th>
            <th className="text-center py-2 px-3 text-mpd-gray font-medium">Severidad</th>
            <th className="text-left py-2 px-3 text-mpd-gray font-medium">Creado</th>
            <th className="text-right py-2 px-3 text-mpd-gray font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((f) => (
            <React.Fragment key={f.id}>
              <tr className="border-b border-mpd-border/30">
                <td className="py-2 px-3 text-xs text-mpd-white">
                  {f.user?.label ?? "—"}
                </td>
                <td className="py-2 px-3 text-xs font-mono text-mpd-amber">{f.reason}</td>
                <td className="py-2 px-3 text-center">
                  <Badge
                    variant={SEVERITY_VARIANT[f.severity] ?? "secondary"}
                    className="text-[10px]"
                  >
                    {f.severity}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-xs text-mpd-gray font-mono">
                  {format(new Date(f.createdAt), "dd/MM HH:mm", { locale: es })}
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    >
                      {expanded === f.id ? "Cerrar" : "Ver"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === f.id}
                      onClick={() => onResolve(f.id, "OK")}
                      aria-label="OK"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pendingId === f.id}
                      onClick={() => onResolve(f.id, "FRAUD")}
                      aria-label="Fraude"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
              {expanded === f.id && (
                <tr className="border-b border-mpd-border/30 bg-mpd-black/20">
                  <td colSpan={5} className="py-3 px-3 text-xs text-mpd-gray">
                    <pre className="whitespace-pre-wrap break-all font-mono">
                      {JSON.stringify(f.evidence, null, 2)}
                    </pre>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
