"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createService } from "@/lib/actions/admin";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function NewServiceForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [category, setCategory] = React.useState<"VPN" | "DATAMINING" | "TOOLS" | "COACHING" | "OTHER">("OTHER");
  const [shortDescription, setShortDescription] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [priceEur, setPriceEur] = React.useState(0);
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (!slug && name) setSlug(slugify(name));
  }, [name, slug]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!name.trim() || !slug.trim() || !shortDescription.trim() || !description.trim()) {
      toast.error("Faltan campos obligatorios");
      return;
    }
    setPending(true);
    try {
      const res = await createService({
        name: name.trim(),
        slug: slug.trim(),
        category,
        shortDescription: shortDescription.trim(),
        description: description.trim(),
        priceEur,
      });
      if ("error" in res) {
        toast.error(res.error as string);
        return;
      }
      toast.success("Servicio creado");
      router.push(`/admin/services/${res.id}`);
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
          <Label className="text-xs">Categoría *</Label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as "VPN" | "DATAMINING" | "TOOLS" | "COACHING" | "OTHER")
            }
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="VPN">VPN</option>
            <option value="DATAMINING">Datamining</option>
            <option value="TOOLS">Herramientas</option>
            <option value="COACHING">Coaching</option>
            <option value="OTHER">Otros</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Precio EUR *</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            value={priceEur}
            onChange={(e) => setPriceEur(parseFloat(e.target.value) || 0)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción corta *</Label>
        <Input
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value.slice(0, 200))}
          required
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción completa *</Label>
        <Textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creando..." : "Crear servicio"}
        </Button>
      </div>
    </form>
  );
}
