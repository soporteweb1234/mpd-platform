"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, FileText, Loader2 } from "lucide-react";
import { useSearchStore } from "@/lib/stores/search-store";

interface SearchResult {
  chunkId: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  contentPreview: string;
  similarity: number | null;
  rrfScore: number;
}

type Grouped = Map<string, { articleTitle: string; articleSlug: string; items: SearchResult[] }>;

function groupByArticle(results: SearchResult[]): Grouped {
  const map: Grouped = new Map();
  for (const r of results) {
    const bucket = map.get(r.articleId);
    if (bucket) {
      bucket.items.push(r);
    } else {
      map.set(r.articleId, {
        articleTitle: r.articleTitle,
        articleSlug: r.articleSlug,
        items: [r],
      });
    }
  }
  return map;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const q = query.trim();
  const lc = text.toLowerCase();
  const qlc = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let cursor = 0;
  while (i < text.length) {
    const idx = lc.indexOf(qlc, i);
    if (idx < 0) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark key={cursor++} className="bg-mpd-gold/25 text-mpd-white rounded-sm px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return parts;
}

export function GlobalSearch() {
  const router = useRouter();
  const isOpen = useSearchStore((s) => s.isOpen);
  const close = useSearchStore((s) => s.close);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          setError(body.error ?? "No pudimos buscar. Intenta en unos segundos.");
          setResults([]);
          return;
        }
        const body = (await res.json()) as { results: SearchResult[] };
        setResults(body.results);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("No pudimos buscar. Intenta en unos segundos.");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [query, isOpen]);

  const onSelect = (articleId: string, articleSlug: string, chunkId: string) => {
    const id = articleSlug || articleId;
    close();
    router.push(`/dashboard/knowledge/${id}#chunk-${chunkId}`);
  };

  if (!isOpen) return null;

  const grouped = groupByArticle(results);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-24 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Buscar en la base de conocimiento"
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-mpd-border bg-mpd-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false} label="Buscar">
          <div className="flex items-center gap-2 border-b border-mpd-border px-4 py-3">
            <Search className="h-4 w-4 text-mpd-gray" />
            <Command.Input
              autoFocus
              placeholder="Buscar en la base de conocimiento…"
              value={query}
              onValueChange={setQuery}
              className="flex-1 bg-transparent text-sm text-mpd-white placeholder:text-mpd-gray focus:outline-none"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-mpd-gray" />}
            <kbd className="hidden sm:inline-flex items-center rounded border border-mpd-border bg-mpd-black/50 px-1.5 py-0.5 text-[10px] font-mono text-mpd-gray">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {error && (
              <div className="px-3 py-6 text-center text-sm text-mpd-amber">
                {error}
              </div>
            )}

            {!error && query.trim().length < 2 && (
              <Command.Empty className="px-3 py-10 text-center text-xs text-mpd-gray">
                Escribe al menos 2 caracteres para buscar en la base de conocimiento.
              </Command.Empty>
            )}

            {!error && query.trim().length >= 2 && !loading && results.length === 0 && (
              <Command.Empty className="px-3 py-10 text-center text-xs text-mpd-gray">
                Sin resultados para &ldquo;{query}&rdquo;.
              </Command.Empty>
            )}

            {loading && results.length === 0 && (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-mpd-black/40"
                  />
                ))}
              </div>
            )}

            {Array.from(grouped.entries()).map(([articleId, group]) => (
              <Command.Group
                key={articleId}
                heading={group.articleTitle}
                className="mb-2"
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-mpd-gold font-medium">
                  {group.articleTitle}
                </div>
                {group.items.map((r) => (
                  <Command.Item
                    key={r.chunkId}
                    value={`${articleId}-${r.chunkId}`}
                    onSelect={() => onSelect(articleId, group.articleSlug, r.chunkId)}
                    className="group flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 text-sm text-mpd-gray aria-selected:bg-mpd-gold/10 aria-selected:text-mpd-white"
                  >
                    <FileText className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mpd-gray group-aria-selected:text-mpd-gold" />
                    <span className="flex-1 min-w-0 text-xs leading-snug">
                      {highlight(r.contentPreview, query)}
                    </span>
                    {r.similarity !== null && (
                      <span className="ml-2 shrink-0 font-mono text-[10px] text-mpd-gray">
                        {(r.similarity * 100).toFixed(0)}%
                      </span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="flex items-center justify-between border-t border-mpd-border px-4 py-2 text-[11px] text-mpd-gray">
            <span>
              <kbd className="font-mono">↵</kbd> abrir · <kbd className="font-mono">Esc</kbd> cerrar
            </span>
            <span>Base de conocimiento MPD</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
