"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createKnowledgeArticle,
  updateKnowledgeArticle,
} from "@/lib/actions/admin";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export type KnowledgeArticleFormProps = {
  mode: "create" | "edit";
  article?: {
    id: string;
    title: string;
    slug: string;
    content: string;
    category: string;
    isPublic: boolean;
    tags: string[];
  };
};

export function KnowledgeArticleForm({ mode, article }: KnowledgeArticleFormProps) {
  const router = useRouter();
  const [title, setTitle] = React.useState(article?.title ?? "");
  const [slug, setSlug] = React.useState(article?.slug ?? "");
  const [category, setCategory] = React.useState(article?.category ?? "general");
  const [isPublic, setIsPublic] = React.useState(article?.isPublic ?? true);
  const [content, setContent] = React.useState(article?.content ?? "");
  const [tagsInput, setTagsInput] = React.useState(article?.tags.join(", ") ?? "");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (mode === "create" && !slug && title) setSlug(slugify(title));
  }, [title, slug, mode]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast.error("Título, slug y contenido son obligatorios");
      return;
    }
    setPending(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        category: category.trim() || "general",
        isPublic,
        tags,
      };
      const res =
        mode === "create"
          ? await createKnowledgeArticle(payload)
          : await updateKnowledgeArticle(article!.id, payload);
      if ("error" in res) {
        toast.error(res.error as string);
        return;
      }
      if ("warning" in res && res.warning) toast.warning(res.warning as string);
      toast.success(mode === "create" ? "Artículo creado" : "Actualizado");
      if (mode === "create" && "id" in res && res.id) {
        router.push(`/admin/knowledge/${res.id}`);
      } else {
        router.refresh();
      }
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
          <Label className="text-xs">Título *</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Categoría</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tags (separadas por coma)</Label>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="rakeback, staking"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Visibilidad</Label>
          <label className="flex items-center gap-2 h-10">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="h-4 w-4 accent-mpd-gold"
            />
            <span className="text-sm text-mpd-white">Público</span>
          </label>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Contenido (Markdown) *</Label>
        <Textarea
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className="font-mono text-xs"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear artículo" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
