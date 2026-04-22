"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, X, Bell } from "lucide-react";
import { sendKnowledgeAsNotification } from "@/lib/actions/admin-kb";
import type { PlayerStratum } from "@prisma/client";

type UserOption = { id: string; name: string; email: string };

const STRATA: PlayerStratum[] = ["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"];
type AudienceKind = "ALL" | "STRATUM" | "USER";

export function KnowledgeSendDialog({
  articleId,
  articleTitle,
  articleContent,
  articleSlug,
  users,
}: {
  articleId: string;
  articleTitle: string;
  articleContent: string;
  articleSlug: string;
  users: UserOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [kind, setKind] = useState<AudienceKind>("ALL");
  const [stratum, setStratum] = useState<PlayerStratum>("NOVATO");
  const [userId, setUserId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState(articleTitle);
  const [customMessage, setCustomMessage] = useState(articleContent.slice(0, 200));

  const reset = () => {
    setKind("ALL");
    setStratum("NOVATO");
    setUserId("");
    setCustomTitle(articleTitle);
    setCustomMessage(articleContent.slice(0, 200));
  };

  const close = () => {
    setOpen(false);
    reset();
  };

  const onSend = () => {
    if (kind === "USER" && !userId) {
      toast.error("Selecciona un destinatario");
      return;
    }
    const audience =
      kind === "ALL"
        ? ({ kind: "ALL" } as const)
        : kind === "STRATUM"
          ? ({ kind: "STRATUM", stratum } as const)
          : ({ kind: "USER", userId } as const);

    startTransition(async () => {
      const res = await sendKnowledgeAsNotification({
        articleId,
        audience,
        customTitle,
        customMessage,
      });
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Enviado a ${res.count} ${res.count === 1 ? "usuario" : "usuarios"}`);
      close();
      router.refresh();
    });
  };

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Bell className="h-3.5 w-3.5 mr-1" /> Enviar
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-mpd-border bg-mpd-surface shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-mpd-border p-4">
              <div>
                <h3 className="text-base font-semibold text-mpd-white">
                  Enviar artículo como notificación
                </h3>
                <p className="text-xs text-mpd-gray">
                  <span className="font-mono">{articleSlug}</span>
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={close}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Audiencia</Label>
                <div className="flex gap-2">
                  {(["ALL", "STRATUM", "USER"] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
                        kind === k
                          ? "border-mpd-gold bg-mpd-gold/10 text-mpd-white"
                          : "border-mpd-border text-mpd-gray hover:text-mpd-white"
                      }`}
                    >
                      {k === "ALL"
                        ? "Todos"
                        : k === "STRATUM"
                          ? "Por estrato"
                          : "Un usuario"}
                    </button>
                  ))}
                </div>
              </div>

              {kind === "STRATUM" && (
                <div className="space-y-1">
                  <Label className="text-xs">Estrato</Label>
                  <select
                    value={stratum}
                    onChange={(e) => setStratum(e.target.value as PlayerStratum)}
                    className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
                  >
                    {STRATA.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {kind === "USER" && (
                <div className="space-y-1">
                  <Label className="text-xs">Usuario</Label>
                  <select
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
                  >
                    <option value="">— Seleccionar —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs">Título de la notificación</Label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={160}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mensaje corto (máx 500 chars)</Label>
                <Textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value.slice(0, 500))}
                />
                <p className="text-[11px] text-mpd-gray">
                  {customMessage.length}/500 · se añadirá link al artículo automáticamente.
                </p>
              </div>

              <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-3">
                <p className="text-[11px] text-mpd-gray mb-2">Previsualización</p>
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-lg bg-mpd-gold/10 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-4 w-4 text-mpd-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-mpd-white">{customTitle || "(sin título)"}</p>
                    <p className="text-xs text-mpd-gray line-clamp-3">
                      {customMessage || "(sin mensaje)"}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px]">
                      KNOWLEDGE_SHARED → /dashboard/knowledge/{articleSlug}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-mpd-border p-4">
              <Button variant="ghost" size="sm" onClick={close}>
                Cancelar
              </Button>
              <Button size="sm" onClick={onSend} disabled={isPending}>
                <Send className="h-3.5 w-3.5 mr-1" />
                {isPending ? "Enviando…" : "Enviar notificación"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
