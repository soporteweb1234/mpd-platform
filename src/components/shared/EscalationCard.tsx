"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LifeBuoy, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { escalateChatToTicket } from "@/lib/actions/chat";

interface EscalationCardProps {
  logId: string;
  reason?: string;
}

/**
 * Banner que aparece cuando el chat RAG detecta baja similitud (<umbral).
 * Ofrece crear ticket de soporte heredando la query + transcript del chat.
 */
export function EscalationCard({ logId, reason }: EscalationCardProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onEscalate = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await escalateChatToTicket({ chatLogId: logId });
      if (result.error) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      if (result.ticketId) {
        router.push(`/dashboard/support/${result.ticketId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fallo al crear ticket.");
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-mpd-amber/40 bg-mpd-amber/5 px-4 py-3 my-2">
      <div className="flex items-start gap-3">
        <LifeBuoy className="h-4 w-4 text-mpd-amber mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-mpd-white font-medium">
            {reason ?? "No encuentro información suficiente en la base de conocimiento."}
          </p>
          <p className="text-[11px] text-mpd-gray mt-0.5">
            ¿Quieres crear un ticket de soporte con el contexto de esta conversación?
          </p>
          {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              onClick={onEscalate}
              disabled={submitting}
              className="h-7 text-[11px] bg-mpd-amber/20 border border-mpd-amber/40 text-mpd-amber hover:bg-mpd-amber/30"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Creando…
                </>
              ) : (
                "Crear ticket con este contexto"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
