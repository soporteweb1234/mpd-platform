"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createTicket } from "@/lib/actions/support";
import { TICKET_CATEGORIES } from "@/lib/constants";

export function CreateTicketForm({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createTicket({
      userId,
      subject: fd.get("subject") as string,
      category: fd.get("category") as string,
      message: fd.get("message") as string,
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Ticket creado correctamente");
      router.push("/dashboard/support");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="subject">Asunto</Label>
        <Input name="subject" id="subject" required placeholder="Describe brevemente tu problema" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Categoría</Label>
        <select
          name="category"
          id="category"
          required
          className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
        >
          <option value="">Seleccionar...</option>
          {TICKET_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message">Mensaje</Label>
        <Textarea name="message" id="message" rows={5} required placeholder="Explica tu problema con el mayor detalle posible..." />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creando..." : "Crear Ticket"}
      </Button>
    </form>
  );
}
