import { Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function ReferralLeaderboard({
  rows,
}: {
  rows: Array<{
    userId: string;
    label: string;
    stratum: string;
    total: number;
    isMe: boolean;
  }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-mpd-gold" />
          Top 20 — últimos 30 días
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mpd-border">
                <th className="text-center py-2 px-2 text-mpd-gray font-medium w-10">#</th>
                <th className="text-left py-2 px-2 text-mpd-gray font-medium">Jugador</th>
                <th className="text-center py-2 px-2 text-mpd-gray font-medium">Estrato</th>
                <th className="text-right py-2 px-2 text-mpd-gray font-medium">Comisiones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.userId}
                  className={`border-b border-mpd-border/40 ${r.isMe ? "bg-mpd-gold/5" : ""}`}
                >
                  <td className="py-2 px-2 text-center text-xs font-mono text-mpd-gray">
                    {i + 1}
                  </td>
                  <td className="py-2 px-2 text-mpd-white">
                    {r.label} {r.isMe && <span className="text-mpd-gold text-[10px]">(tú)</span>}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge variant="outline" className="text-[10px]">
                      {r.stratum}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-mpd-green">
                    {fmtMoney(r.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-mpd-gray mt-3">
          El leaderboard es opt-in. Puedes ocultarte desde Configuración.
        </p>
      </CardContent>
    </Card>
  );
}
