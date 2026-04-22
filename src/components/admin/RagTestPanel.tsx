"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { testRagQuery, type TestRagResult } from "@/lib/actions/admin-chat";

export function RagTestPanel() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<TestRagResult | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    if (!query.trim()) return;
    startTransition(async () => {
      const res = await testRagQuery(query);
      setResult(res);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: ¿Cómo funciona el rakeback NGR?"
          onKeyDown={(e) => {
            if (e.key === "Enter") run();
          }}
        />
        <Button onClick={run} disabled={pending || !query.trim()} size="sm">
          <Search className="h-3.5 w-3.5 mr-1" />
          {pending ? "Buscando…" : "Probar"}
        </Button>
      </div>

      {result?.error && (
        <p className="text-xs text-red-400">Error: {result.error}</p>
      )}

      {result && !result.error && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="text-[10px]">
              Similitud máx: {result.maxSimilarity.toFixed(3)}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {result.chunks.length} chunks
            </Badge>
          </div>
          {result.chunks.length === 0 ? (
            <p className="text-xs text-mpd-gray">
              Sin resultados. Chat escalaría a ticket.
            </p>
          ) : (
            <div className="space-y-2">
              {result.chunks.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-mpd-border bg-mpd-black/40 px-3 py-2 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-mpd-white truncate">
                      #{i + 1} · {c.articleTitle ?? c.articleId}
                    </span>
                    <div className="flex gap-1.5 shrink-0">
                      {c.similarity !== undefined && (
                        <Badge variant="secondary" className="text-[10px]">
                          sim {c.similarity.toFixed(3)}
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-[10px]">
                        rrf {c.rrfScore.toFixed(4)}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-mpd-gray whitespace-pre-wrap line-clamp-4">
                    {c.preview}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
