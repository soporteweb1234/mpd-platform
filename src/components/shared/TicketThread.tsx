"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { sendTicketMessage } from "@/lib/actions/support";

type Message = {
  id: string;
  senderRole: string;
  content: string;
  createdAt: string;
  senderLabel: string;
};

export function TicketThread({
  ticketId,
  currentUserId,
  currentRole,
  messages,
  readOnly = false,
}: {
  ticketId: string;
  currentUserId: string;
  currentRole: "PLAYER" | "ADMIN";
  messages: Message[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (pending || readOnly) return;
    const trimmed = content.trim();
    if (trimmed.length < 2) {
      toast.error("Escribe un mensaje");
      return;
    }
    setPending(true);
    try {
      const res = await sendTicketMessage({
        ticketId,
        senderId: currentUserId,
        senderRole: currentRole,
        content: trimmed,
      });
      if ("error" in res) {
        toast.error(res.error as string);
        return;
      }
      toast.success("Enviado");
      setContent("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg border border-mpd-border p-3 ${
              m.senderRole === "ADMIN" ? "bg-mpd-gold/5" : "bg-mpd-surface"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Badge variant={m.senderRole === "ADMIN" ? "warning" : "outline"} className="text-[10px]">
                {m.senderLabel}
              </Badge>
              <span className="text-[10px] text-mpd-gray font-mono">
                {new Date(m.createdAt).toLocaleString("es-ES")}
              </span>
            </div>
            <p className="text-sm text-mpd-white whitespace-pre-wrap">{m.content}</p>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="text-xs text-mpd-gray text-center py-4">
            Sin mensajes aún.
          </li>
        )}
      </ul>

      {!readOnly && (
        <form onSubmit={onSend} className="space-y-2 border-t border-mpd-border pt-3">
          <Textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, 4000))}
            placeholder="Escribe tu respuesta..."
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending}>
              <Send className="h-3.5 w-3.5 mr-1" />
              {pending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
