import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En hold",
  AVAILABLE: "Disponible",
  HELD: "Retenida (revisión)",
  REJECTED: "Rechazada",
  REVERSED: "Revertida",
};

const STATUS_VARIANT: Record<
  string,
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

export function ReferralAttributionsTable({
  attributions,
}: {
  attributions: Array<{
    id: string;
    createdAt: string;
    amount: number;
    commissionPct: number;
    level: number;
    status: string;
    referredLabel: string;
  }>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mpd-border">
            <th className="text-left py-2 px-2 text-mpd-gray font-medium">Fecha</th>
            <th className="text-left py-2 px-2 text-mpd-gray font-medium">Referido</th>
            <th className="text-center py-2 px-2 text-mpd-gray font-medium">Nivel</th>
            <th className="text-right py-2 px-2 text-mpd-gray font-medium">%</th>
            <th className="text-right py-2 px-2 text-mpd-gray font-medium">Monto</th>
            <th className="text-center py-2 px-2 text-mpd-gray font-medium">Estado</th>
          </tr>
        </thead>
        <tbody>
          {attributions.map((a) => (
            <tr key={a.id} className="border-b border-mpd-border/40">
              <td className="py-2 px-2 text-xs text-mpd-gray font-mono">
                {format(new Date(a.createdAt), "dd MMM HH:mm", { locale: es })}
              </td>
              <td className="py-2 px-2 text-mpd-white">{a.referredLabel}</td>
              <td className="py-2 px-2 text-center">
                <Badge variant="outline" className="text-[10px]">
                  L{a.level}
                </Badge>
              </td>
              <td className="py-2 px-2 text-right font-mono text-xs text-mpd-gray">
                {a.commissionPct.toFixed(2)}%
              </td>
              <td className="py-2 px-2 text-right font-mono text-mpd-green">
                {fmtMoney(a.amount)}
              </td>
              <td className="py-2 px-2 text-center">
                <Badge variant={STATUS_VARIANT[a.status] ?? "outline"} className="text-[10px]">
                  {STATUS_LABEL[a.status] ?? a.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
