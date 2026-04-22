"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  createAchievement,
  updateAchievement,
  deleteAchievement,
  type AchievementInput,
} from "@/lib/actions/admin-status";

type Achievement = AchievementInput & { id: string };

const EMPTY: AchievementInput = {
  slug: "",
  name: "",
  description: "",
  icon: "award",
  category: "general",
  pointsAwarded: 10,
  requiredValue: null,
  isSecret: false,
  sortOrder: 0,
};

export function AchievementCatalogEditor({
  achievements,
}: {
  achievements: Achievement[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-mpd-gray">
          {achievements.length} {achievements.length === 1 ? "logro" : "logros"}
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo logro
          </Button>
        )}
      </div>

      {creating && (
        <AchievementEditor
          initial={EMPTY}
          onDone={() => setCreating(false)}
        />
      )}

      <div className="space-y-2">
        {achievements.map((a) =>
          editingId === a.id ? (
            <AchievementEditor
              key={a.id}
              id={a.id}
              initial={a}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <AchievementRow
              key={a.id}
              achievement={a}
              onEdit={() => setEditingId(a.id)}
            />
          ),
        )}
      </div>
    </div>
  );
}

function AchievementRow({
  achievement,
  onEdit,
}: {
  achievement: Achievement;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const onDelete = () => {
    if (!confirm(`¿Eliminar "${achievement.name}"?`)) return;
    startDelete(async () => {
      const res = await deleteAchievement(achievement.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Logro eliminado");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm text-mpd-white truncate">{achievement.name}</p>
          <span className="text-[10px] text-mpd-gray font-mono">
            {achievement.slug}
          </span>
          <span className="text-[10px] text-mpd-gold font-mono">
            +{achievement.pointsAwarded}
          </span>
        </div>
        <p className="text-[11px] text-mpd-gray truncate">
          {achievement.category} · {achievement.description}
        </p>
      </div>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="text-mpd-amber hover:text-mpd-amber"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AchievementEditor({
  id,
  initial,
  onDone,
}: {
  id?: string;
  initial: AchievementInput;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<AchievementInput>(initial);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = id
        ? await updateAchievement(id, form)
        : await createAchievement(form);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(id ? "Logro actualizado" : "Logro creado");
      onDone();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-mpd-gold/40 bg-mpd-surface/50 p-3 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nombre</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
          required
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Icono (Lucide)</Label>
          <Input
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            placeholder="award"
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Categoría</Label>
          <Input
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Puntos</Label>
          <Input
            type="number"
            min={0}
            value={form.pointsAwarded}
            onChange={(e) =>
              setForm((f) => ({ ...f, pointsAwarded: Number(e.target.value) }))
            }
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Orden</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
            }
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-xs text-mpd-white">
        <input
          type="checkbox"
          checked={form.isSecret}
          onChange={(e) => setForm((f) => ({ ...f, isSecret: e.target.checked }))}
          className="h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
        />
        Logro secreto (no visible hasta desbloquearlo)
      </label>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando…" : id ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
