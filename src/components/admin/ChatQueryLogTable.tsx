import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

export interface ChatQueryLogRow {
  id: string;
  query: string;
  maxSimilarity: number | null;
  latencyMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  escalatedToTicketId: string | null;
  createdAt: Date;
  userLabel: string;
}

export function ChatQueryLogTable({
  rows,
  threshold,
}: {
  rows: ChatQueryLogRow[];
  threshold: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-mpd-gray">
        Aún no hay consultas registradas. Envía un mensaje desde /dashboard/chat para
        empezar a ver telemetría.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-mpd-border">
      <table className="w-full text-xs">
        <thead className="bg-mpd-black/40 text-mpd-gray uppercase tracking-wider text-[10px]">
          <tr>
            <th className="text-left px-3 py-2">Fecha</th>
            <th className="text-left px-3 py-2">Usuario</th>
            <th className="text-left px-3 py-2">Query</th>
            <th className="text-right px-3 py-2">Sim máx</th>
            <th className="text-right px-3 py-2">Lat</th>
            <th className="text-right px-3 py-2">Tokens in/out</th>
            <th className="text-left px-3 py-2">Ticket</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const below = r.maxSimilarity !== null && r.maxSimilarity < threshold;
            return (
              <tr
                key={r.id}
                className="border-t border-mpd-border/60 text-mpd-white"
              >
                <td className="px-3 py-2 whitespace-nowrap text-mpd-gray">
                  {formatDateTime(r.createdAt)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-mpd-gray">
                  {r.userLabel}
                </td>
                <td className="px-3 py-2 max-w-[320px] truncate" title={r.query}>
                  {r.query}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {r.maxSimilarity === null ? (
                    <span className="text-mpd-gray">—</span>
                  ) : (
                    <Badge
                      variant={below ? "secondary" : "success"}
                      className="text-[10px]"
                    >
                      {r.maxSimilarity.toFixed(3)}
                    </Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-mpd-gray">
                  {r.latencyMs ? `${r.latencyMs}ms` : "—"}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap text-mpd-gray">
                  {r.tokensIn ?? "—"} / {r.tokensOut ?? "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {r.escalatedToTicketId ? (
                    <Badge variant="warning" className="text-[10px]">
                      escalado
                    </Badge>
                  ) : (
                    <span className="text-mpd-gray">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
