"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseRakebackCsv, type ParsedRow } from "@/lib/rakeback/csvParser";
import { loadRakeback } from "@/lib/actions/admin";
import { Upload, FileText, Check, X, AlertTriangle } from "lucide-react";

type User = { id: string; email: string; name: string };
type Room = { id: string; slug: string; name: string };

type ResolvedRow = ParsedRow & {
  userId: string | null;
  roomId: string | null;
  roomName: string | null;
  userName: string | null;
  rakebackAmount: number;
  status: "ok" | "error" | "loaded" | "failed";
  failureReason?: string;
};

export function RakebackCsvUpload({
  users,
  rooms,
}: {
  users: User[];
  rooms: Room[];
}) {
  const [rows, setRows] = useState<ResolvedRow[] | null>(null);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const userByEmail = useMemo(() => {
    const map = new Map<string, User>();
    for (const u of users) map.set(u.email.toLowerCase(), u);
    return map;
  }, [users]);

  const roomBySlug = useMemo(() => {
    const map = new Map<string, Room>();
    for (const r of rooms) map.set(r.slug.toLowerCase(), r);
    return map;
  }, [rooms]);

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseRakebackCsv(text);
    if (parsed.headerError) {
      setHeaderError(parsed.headerError);
      setRows(null);
      return;
    }
    setHeaderError(null);
    const resolved: ResolvedRow[] = parsed.rows.map((r) => {
      const user = userByEmail.get(r.userEmail.toLowerCase());
      const room = roomBySlug.get(r.roomSlug.toLowerCase());
      const extraErrors = [...r.errors];
      if (!user) extraErrors.push(`usuario ${r.userEmail} no existe`);
      if (!room) extraErrors.push(`sala ${r.roomSlug} no existe`);
      return {
        ...r,
        errors: extraErrors,
        userId: user?.id ?? null,
        roomId: room?.id ?? null,
        userName: user?.name ?? null,
        roomName: room?.name ?? null,
        rakebackAmount: (r.rakeGenerated * r.rakebackPercent) / 100,
        status: extraErrors.length > 0 ? "error" : "ok",
      };
    });
    setRows(resolved);
  };

  const confirmRow = (idx: number) => {
    if (!rows) return;
    const row = rows[idx];
    if (row.status !== "ok" || !row.userId || !row.roomId) return;

    setBusy(idx);
    startTransition(async () => {
      const res = await loadRakeback({
        userId: row.userId!,
        roomId: row.roomId!,
        period: row.period,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        rakeGenerated: row.rakeGenerated,
        rakebackPercent: row.rakebackPercent,
        notes: row.notes,
      });

      setRows((prev) =>
        prev
          ? prev.map((r, i) =>
              i === idx
                ? res && "error" in res
                  ? { ...r, status: "failed" as const, failureReason: res.error }
                  : { ...r, status: "loaded" as const }
                : r,
            )
          : prev,
      );

      if (res && "error" in res) {
        toast.error(`Fila ${row.index}: ${res.error}`);
      } else {
        toast.success(`Fila ${row.index} cargada: €${row.rakebackAmount.toFixed(2)}`);
      }
      setBusy(null);
    });
  };

  const okCount = rows?.filter((r) => r.status === "ok").length ?? 0;
  const errorCount = rows?.filter((r) => r.status === "error").length ?? 0;
  const loadedCount = rows?.filter((r) => r.status === "loaded").length ?? 0;

  const reset = () => {
    setRows(null);
    setHeaderError(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-mpd-gold" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-mpd-white">
                  Importación masiva CSV
                </h3>
                <p className="text-xs text-mpd-gray">
                  Columnas: userEmail, roomSlug, rakeGenerated, rakebackPercent,
                  periodStart (YYYY-MM-DD), periodEnd (YYYY-MM-DD), notes
                  (opcional)
                </p>
              </div>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 text-xs text-mpd-gray">
                <FileText className="h-4 w-4" />
                <span className="truncate max-w-[200px]">{fileName}</span>
                <button onClick={reset} className="hover:text-mpd-white" aria-label="Reset">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="block text-xs text-mpd-gray file:mr-3 file:rounded-md file:border-0 file:bg-mpd-gold/10 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-mpd-gold hover:file:bg-mpd-gold/20"
            />
          </div>
        </CardContent>
      </Card>

      {headerError && (
        <div className="rounded-lg border border-mpd-red/40 bg-mpd-red/10 p-3 text-sm text-mpd-red flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">CSV inválido</p>
            <p className="text-xs">{headerError}</p>
          </div>
        </div>
      )}

      {rows && rows.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="success">{okCount} OK</Badge>
            {loadedCount > 0 && <Badge variant="success">{loadedCount} cargadas</Badge>}
            {errorCount > 0 && <Badge variant="warning">{errorCount} con error</Badge>}
            <span className="text-mpd-gray">{rows.length} filas totales</span>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-mpd-border bg-mpd-black/30">
                    <th className="text-left p-2 font-medium text-mpd-gray">#</th>
                    <th className="text-left p-2 font-medium text-mpd-gray">Usuario</th>
                    <th className="text-left p-2 font-medium text-mpd-gray">Sala</th>
                    <th className="text-right p-2 font-medium text-mpd-gray">Rake</th>
                    <th className="text-right p-2 font-medium text-mpd-gray">%</th>
                    <th className="text-right p-2 font-medium text-mpd-gray">Crédito</th>
                    <th className="text-left p-2 font-medium text-mpd-gray">Período</th>
                    <th className="text-center p-2 font-medium text-mpd-gray">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={r.index}
                      className={`border-b border-mpd-border/30 ${
                        r.status === "error"
                          ? "bg-mpd-red/5"
                          : r.status === "loaded"
                            ? "bg-mpd-green/5"
                            : ""
                      }`}
                    >
                      <td className="p-2 text-mpd-gray">{r.index}</td>
                      <td className="p-2">
                        <div className="text-mpd-white">{r.userName ?? "—"}</div>
                        <div className="text-[10px] text-mpd-gray">{r.userEmail}</div>
                      </td>
                      <td className="p-2 text-mpd-white">{r.roomName ?? r.roomSlug}</td>
                      <td className="p-2 text-right font-mono">
                        €{r.rakeGenerated.toFixed(2)}
                      </td>
                      <td className="p-2 text-right font-mono">{r.rakebackPercent}%</td>
                      <td className="p-2 text-right font-mono text-mpd-gold">
                        €{r.rakebackAmount.toFixed(2)}
                      </td>
                      <td className="p-2 text-mpd-gray">
                        {r.periodStart} → {r.periodEnd}
                      </td>
                      <td className="p-2 text-center">
                        {r.status === "loaded" ? (
                          <Badge variant="success" className="gap-1">
                            <Check className="h-3 w-3" /> Cargada
                          </Badge>
                        ) : r.status === "error" ? (
                          <span
                            className="text-[10px] text-mpd-red"
                            title={r.errors.join("; ")}
                          >
                            {r.errors[0]}
                          </span>
                        ) : r.status === "failed" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending || busy === idx}
                            onClick={() => confirmRow(idx)}
                            title={r.failureReason}
                          >
                            Reintentar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={isPending || busy === idx}
                            onClick={() => confirmRow(idx)}
                          >
                            {busy === idx ? "Cargando…" : "Confirmar"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
