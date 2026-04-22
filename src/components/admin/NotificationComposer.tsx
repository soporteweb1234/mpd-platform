"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bell, BookOpen, Send, User, Users } from "lucide-react";
import { sendNotification, sendBulkNotification } from "@/lib/actions/admin";

type UserOption = { id: string; name: string; email: string };
type KbOption = { id: string; slug: string; title: string; content: string };

const TYPES = [
  { value: "SYSTEM", label: "Sistema" },
  { value: "RAKEBACK", label: "Rakeback" },
  { value: "BALANCE", label: "Saldo" },
  { value: "DROP", label: "Drop Sorpresa" },
  { value: "COURSE", label: "Curso" },
  { value: "KNOWLEDGE_SHARED", label: "Knowledge" },
];

export function NotificationComposer({
  users,
  articles,
}: {
  users: UserOption[];
  articles: KbOption[];
}) {
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"individual" | "bulk">("individual");
  const [userId, setUserId] = useState("");
  const [type, setType] = useState("SYSTEM");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [importSlug, setImportSlug] = useState("");
  const [filterStratum, setFilterStratum] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const onImport = (slug: string) => {
    setImportSlug(slug);
    if (!slug) return;
    const article = articles.find((a) => a.slug === slug);
    if (!article) return;
    setTitle(article.title);
    setMessage(article.content.slice(0, 200));
    setLink(`/dashboard/knowledge/${article.slug}`);
    setType("KNOWLEDGE_SHARED");
    toast.success("Artículo importado en el composer");
  };

  const onSend = () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Título y mensaje son obligatorios");
      return;
    }
    if (mode === "individual" && !userId) {
      toast.error("Selecciona un jugador");
      return;
    }
    startTransition(async () => {
      if (mode === "individual") {
        const res = await sendNotification({
          userId,
          type,
          title,
          message,
          link: link || undefined,
        });
        if (res && "error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success("Notificación enviada");
      } else {
        const filters: { stratum?: string; role?: string } = {};
        if (filterStratum) filters.stratum = filterStratum;
        if (filterRole) filters.role = filterRole;
        const res = await sendBulkNotification({
          type,
          title,
          message,
          link: link || undefined,
          filters: Object.keys(filters).length ? filters : undefined,
        });
        if (res && "error" in res) {
          toast.error(res.error);
          return;
        }
        toast.success(`Enviado a ${res.count} usuarios`);
      }
      setTitle("");
      setMessage("");
      setLink("");
      setImportSlug("");
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant={mode === "individual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("individual")}
          >
            <User className="h-3.5 w-3.5 mr-1" /> Individual
          </Button>
          <Button
            type="button"
            variant={mode === "bulk" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("bulk")}
          >
            <Users className="h-3.5 w-3.5 mr-1" /> Masiva
          </Button>
        </div>

        {articles.length > 0 && (
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Importar desde Knowledge Base
            </Label>
            <select
              value={importSlug}
              onChange={(e) => onImport(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
            >
              <option value="">— No importar —</option>
              {articles.map((a) => (
                <option key={a.id} value={a.slug}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {mode === "individual" && (
          <div className="space-y-1">
            <Label className="text-xs">Jugador</Label>
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

        {mode === "bulk" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Filtrar por estrato</Label>
              <select
                value={filterStratum}
                onChange={(e) => setFilterStratum(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
              >
                <option value="">— Todos —</option>
                <option value="NOVATO">Novato</option>
                <option value="SEMI_PRO">Semi-pro</option>
                <option value="PROFESIONAL">Profesional</option>
                <option value="REFERENTE">Referente</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Filtrar por rol</Label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
              >
                <option value="">— Todos —</option>
                <option value="USER">Usuario</option>
                <option value="TEACHER">Profesor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            required
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Mensaje</Label>
          <Textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 500))}
            required
          />
          <p className="text-[11px] text-mpd-gray">{message.length}/500</p>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Link (opcional)</Label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/dashboard/..."
          />
        </div>

        <Button onClick={onSend} disabled={isPending} className="w-full">
          <Send className="h-4 w-4 mr-1" />
          {isPending
            ? "Enviando…"
            : mode === "individual"
              ? "Enviar notificación"
              : "Enviar en masa"}
        </Button>
      </div>

      <aside className="space-y-2">
        <p className="text-xs text-mpd-gray uppercase tracking-wider">Preview</p>
        <div className="rounded-xl border border-mpd-border bg-mpd-black/40 p-3">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-lg bg-mpd-gold/10 flex items-center justify-center flex-shrink-0">
              <Bell className="h-4 w-4 text-mpd-gold" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-mpd-white line-clamp-2">
                {title || "(Título)"}
              </p>
              <p className="text-xs text-mpd-gray line-clamp-4 whitespace-pre-wrap">
                {message || "(Mensaje)"}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">
                  {type}
                </Badge>
                {link && (
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {link}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-mpd-gray">
          Se mostrará así en el bell de los destinatarios.
        </p>
      </aside>
    </div>
  );
}
