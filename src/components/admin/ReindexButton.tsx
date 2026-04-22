"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { reindexAllKnowledge } from "@/lib/actions/admin-chat";

export function ReindexButton() {
  const [pending, startTransition] = useTransition();
  const [summary, setSummary] = useState<
    | null
    | { total: number; reindexed: number; skipped: number; failed: number }
  >(null);

  const run = () => {
    startTransition(async () => {
      const res = await reindexAllKnowledge();
      if (res.error) {
        toast.error(res.error);
        return;
      }
      const { total = 0, reindexed = 0, skipped = 0, failed = 0 } = res;
      setSummary({ total, reindexed, skipped, failed });
      if (failed > 0) {
        toast.error(
          `Re-indexado terminó con ${failed} fallos. Revisa los logs del servidor.`,
        );
      } else {
        toast.success(
          `Re-indexado ok — ${reindexed} nuevo(s), ${skipped} sin cambios.`,
        );
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button onClick={run} disabled={pending} variant="secondary" size="sm">
        {pending ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            Re-indexando…
          </>
        ) : (
          <>
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Re-embedear knowledge base completo
          </>
        )}
      </Button>
      {summary && (
        <p className="text-[11px] text-mpd-gray">
          {summary.total} artículos · {summary.reindexed} re-indexados · {summary.skipped}{" "}
          sin cambios (hash igual) · {summary.failed} fallos
        </p>
      )}
      <p className="text-[10px] text-mpd-gray">
        Idempotente vía sha256(title+content). Usa esto tras cambiar el modelo de
        embeddings o cuando detectes drift.
      </p>
    </div>
  );
}
