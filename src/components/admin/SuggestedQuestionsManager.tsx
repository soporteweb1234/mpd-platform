"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Power, Trash2, Check, X } from "lucide-react";
import {
  createSuggestedQuestion,
  deleteSuggestedQuestion,
  toggleSuggestedQuestion,
  updateSuggestedQuestion,
} from "@/lib/actions/admin-bot";

type Row = {
  id: string;
  question: string;
  category: string | null;
  priority: number;
  active: boolean;
  timesAsked: number;
};

type Draft = {
  id: string | null;
  question: string;
  category: string;
  priority: number;
  active: boolean;
};

const EMPTY: Draft = {
  id: null,
  question: "",
  category: "",
  priority: 0,
  active: true,
};

export function SuggestedQuestionsManager({ items }: { items: Row[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Draft | null>(null);

  const startCreate = () => setDraft({ ...EMPTY });
  const startEdit = (row: Row) =>
    setDraft({
      id: row.id,
      question: row.question,
      category: row.category ?? "",
      priority: row.priority,
      active: row.active,
    });
  const cancel = () => setDraft(null);

  const save = () => {
    if (!draft) return;
    if (!draft.question.trim() || draft.question.trim().length < 5) {
      toast.error("La pregunta debe tener al menos 5 caracteres");
      return;
    }
    const payload = {
      question: draft.question,
      category: draft.category || null,
      priority: draft.priority,
      active: draft.active,
    };
    startTransition(async () => {
      const res = draft.id
        ? await updateSuggestedQuestion(draft.id, payload)
        : await createSuggestedQuestion(payload);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(draft.id ? "Pregunta actualizada" : "Pregunta creada");
      setDraft(null);
      router.refresh();
    });
  };

  const toggle = (row: Row) => {
    startTransition(async () => {
      const res = await toggleSuggestedQuestion(row.id, !row.active);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      router.refresh();
    });
  };

  const remove = (row: Row) => {
    if (!confirm(`¿Borrar "${row.question.slice(0, 60)}"?`)) return;
    startTransition(async () => {
      const res = await deleteSuggestedQuestion(row.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Pregunta borrada");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-mpd-gray">
          {items.length} pregunta{items.length === 1 ? "" : "s"} configurada
          {items.length === 1 ? "" : "s"}
        </p>
        {!draft && (
          <Button size="sm" onClick={startCreate}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva
          </Button>
        )}
      </div>

      {draft && (
        <div className="rounded-xl border border-mpd-gold/40 bg-mpd-gold/5 p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Pregunta</Label>
            <Textarea
              rows={2}
              value={draft.question}
              onChange={(e) =>
                setDraft({ ...draft, question: e.target.value.slice(0, 500) })
              }
              placeholder="¿Cómo retiro mi rakeback?"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Categoría</Label>
              <Input
                value={draft.category}
                onChange={(e) =>
                  setDraft({ ...draft, category: e.target.value.slice(0, 40) })
                }
                placeholder="onboarding, rakeback..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prioridad</Label>
              <Input
                type="number"
                min={0}
                max={999}
                value={draft.priority}
                onChange={(e) =>
                  setDraft({ ...draft, priority: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Estado</Label>
              <label className="flex items-center gap-2 h-10">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-mpd-white">Activa</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={isPending}>
              <Check className="h-3.5 w-3.5 mr-1" />
              {draft.id ? "Guardar cambios" : "Crear pregunta"}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 && !draft && (
          <p className="text-sm text-mpd-gray">
            No hay preguntas sugeridas. Crea la primera.
          </p>
        )}
        {items.map((row) => (
          <div
            key={row.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-mpd-border/50 bg-mpd-black/30 p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-mpd-white">{row.question}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {row.category && (
                  <Badge variant="outline" className="text-[10px]">
                    {row.category}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px]">
                  prio {row.priority}
                </Badge>
                <Badge
                  variant={row.active ? "success" : "secondary"}
                  className="text-[10px]"
                >
                  {row.active ? "activa" : "inactiva"}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {row.timesAsked} consultas
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggle(row)}
                disabled={isPending}
                title={row.active ? "Desactivar" : "Activar"}
              >
                <Power className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startEdit(row)}
                disabled={isPending || !!draft}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => remove(row)}
                disabled={isPending}
                className="text-mpd-red hover:text-mpd-red"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
