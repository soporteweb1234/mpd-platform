"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendNotification, sendBulkNotification } from "@/lib/actions/admin";

interface Props {
  users: { id: string; name: string; email: string }[];
}

export function NotificationSendForm({ users }: Props) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"individual" | "bulk">("individual");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);

    if (mode === "individual") {
      const result = await sendNotification({
        userId: fd.get("userId") as string,
        type: fd.get("type") as string,
        title: fd.get("title") as string,
        message: fd.get("message") as string,
        link: (fd.get("link") as string) || undefined,
      });
      if (result && "error" in result) toast.error(result.error);
      else toast.success("Notificación enviada");
    } else {
      const result = await sendBulkNotification({
        type: fd.get("type") as string,
        title: fd.get("title") as string,
        message: fd.get("message") as string,
        link: (fd.get("link") as string) || undefined,
      });
      if (result && "error" in result) toast.error(result.error);
      else toast.success(`Notificación enviada a ${result.count} usuarios`);
    }

    setLoading(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === "individual" ? "default" : "outline"} size="sm" onClick={() => setMode("individual")}>
          Individual
        </Button>
        <Button type="button" variant={mode === "bulk" ? "default" : "outline"} size="sm" onClick={() => setMode("bulk")}>
          Masiva
        </Button>
      </div>

      {mode === "individual" && (
        <div className="space-y-2">
          <Label htmlFor="userId">Jugador</Label>
          <select
            name="userId"
            id="userId"
            required
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">Seleccionar...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="type">Tipo</Label>
        <select
          name="type"
          id="type"
          required
          className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
        >
          <option value="SYSTEM">Sistema</option>
          <option value="RAKEBACK">Rakeback</option>
          <option value="BALANCE">Saldo</option>
          <option value="DROP">Drop Sorpresa</option>
          <option value="COURSE">Curso</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input name="title" id="title" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea name="message" id="message" rows={3} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="link">Link (opcional)</Label>
        <Input name="link" id="link" placeholder="/dashboard/..." />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando..." : mode === "individual" ? "Enviar Notificación" : "Enviar a Todos"}
      </Button>
    </form>
  );
}
