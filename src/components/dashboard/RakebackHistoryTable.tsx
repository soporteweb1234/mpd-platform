"use client";

import { useState, useMemo } from "react";
import { formatDate, formatUSD } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface RakebackRow {
  id: string;
  periodStart: string;
  periodEnd: string;
  rakeAmount: number;
  rakebackAmount: number;
  room: string;
}

const PAGE_SIZE = 10;

export function RakebackHistoryTable({ rows }: { rows: RakebackRow[] }) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [rows, page]
  );

  if (rows.length === 0) {
    return (
      <p className="text-sm text-mpd-gray text-center py-8">
        Aún no tienes histórico de rakeback
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-mpd-gray border-b border-mpd-border">
              <th className="text-left font-medium py-2">Periodo</th>
              <th className="text-left font-medium py-2">Sala</th>
              <th className="text-right font-medium py-2">Rake</th>
              <th className="text-right font-medium py-2">Rakeback</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr key={r.id} className="border-b border-mpd-border/50 last:border-0">
                <td className="py-2 text-mpd-white">
                  {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
                </td>
                <td className="py-2 text-mpd-gray">{r.room}</td>
                <td className="py-2 text-right font-mono text-mpd-gray">
                  {formatUSD(r.rakeAmount)}
                </td>
                <td className="py-2 text-right font-mono text-mpd-gold">
                  {formatUSD(r.rakebackAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-mpd-gray">
          <span>
            Página {page + 1} de {totalPages} — {rows.length} registros
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
