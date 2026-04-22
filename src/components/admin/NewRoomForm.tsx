"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createRoom } from "@/lib/actions/admin";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function NewRoomForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [affiliateCode, setAffiliateCode] = React.useState("");
  const [rakebackBase, setRakebackBase] = React.useState(30);
  const [website, setWebsite] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!slug && name) setSlug(slugify(name));
  }, [name, slug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!name.trim() || !slug.trim() || !affiliateCode.trim()) {
      toast.error("Nombre, slug y affiliateCode son obligatorios");
      return;
    }
    setPending(true);
    try {
      const res = await createRoom({
        name: name.trim(),
        slug: slug.trim(),
        affiliateCode: affiliateCode.trim(),
        rakebackBase,
        website: website.trim() || null,
        description: description.trim() || null,
      });
      if ("error" in res) {
        toast.error(res.error as string);
        return;
      }
      toast.success("Sala creada");
      router.push(`/admin/rooms/${res.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nombre *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug *</Label>
          <Input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Affiliate code *</Label>
          <Input
            value={affiliateCode}
            onChange={(e) => setAffiliateCode(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Rakeback base % *</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={rakebackBase}
            onChange={(e) => setRakebackBase(parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Website (opcional)</Label>
        <Input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://sala.com"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción corta (opcional)</Label>
        <Textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creando..." : "Crear sala"}
        </Button>
      </div>
    </form>
  );
}
