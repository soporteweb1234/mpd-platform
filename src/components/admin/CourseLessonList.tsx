"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createLesson,
  updateLesson,
  deleteLesson,
  type LessonInput,
} from "@/lib/actions/admin-courses";
import { Pencil, Trash2, Plus } from "lucide-react";

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  lessonNumber: number;
  scheduledAt: Date | string | null;
  recordingUrl: string | null;
  materials: string[];
};

function isoLocal(d?: Date | string | null) {
  if (!d) return "";
  const dd = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dd.getTime())) return "";
  return dd.toISOString().slice(0, 16);
}

export function CourseLessonList({
  courseId,
  lessons,
}: {
  courseId: string;
  lessons: Lesson[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-mpd-gray">
          {lessons.length} {lessons.length === 1 ? "lección" : "lecciones"}
        </p>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> Añadir lección
          </Button>
        )}
      </div>

      {creating && (
        <LessonEditor
          courseId={courseId}
          suggestedNumber={lessons.length + 1}
          onDone={() => setCreating(false)}
        />
      )}

      <div className="space-y-2">
        {lessons.map((l) =>
          editingId === l.id ? (
            <LessonEditor
              key={l.id}
              courseId={courseId}
              lesson={l}
              onDone={() => setEditingId(null)}
            />
          ) : (
            <LessonRow
              key={l.id}
              lesson={l}
              onEdit={() => setEditingId(l.id)}
            />
          ),
        )}
        {lessons.length === 0 && !creating && (
          <p className="text-sm text-mpd-gray py-6 text-center">
            Este curso aún no tiene lecciones.
          </p>
        )}
      </div>
    </div>
  );
}

function LessonRow({ lesson, onEdit }: { lesson: Lesson; onEdit: () => void }) {
  const router = useRouter();
  const [isDeleting, startDelete] = useTransition();

  const onDelete = () => {
    if (!confirm(`¿Eliminar la lección ${lesson.lessonNumber}: "${lesson.title}"?`)) return;
    startDelete(async () => {
      const res = await deleteLesson(lesson.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Lección eliminada");
      router.refresh();
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-mpd-white">
          <span className="font-mono text-mpd-gold mr-2">#{lesson.lessonNumber}</span>
          {lesson.title}
        </p>
        {lesson.scheduledAt && (
          <p className="text-[11px] text-mpd-gray">
            {new Date(lesson.scheduledAt).toLocaleString("es-ES")}
          </p>
        )}
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

function LessonEditor({
  courseId,
  lesson,
  suggestedNumber,
  onDone,
}: {
  courseId: string;
  lesson?: Lesson;
  suggestedNumber?: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<LessonInput>({
    title: lesson?.title ?? "",
    description: lesson?.description ?? null,
    lessonNumber: lesson?.lessonNumber ?? suggestedNumber ?? 1,
    scheduledAt: isoLocal(lesson?.scheduledAt) || null,
    recordingUrl: lesson?.recordingUrl ?? null,
    materials: lesson?.materials ?? [],
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = lesson
        ? await updateLesson(lesson.id, form)
        : await createLesson(courseId, form);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(lesson ? "Lección actualizada" : "Lección creada");
      onDone();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-mpd-gold/40 bg-mpd-surface/50 p-3 space-y-3"
    >
      <div className="grid grid-cols-1 md:grid-cols-[80px_1fr] gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nº</Label>
          <Input
            type="number"
            min={1}
            value={form.lessonNumber}
            onChange={(e) =>
              setForm((f) => ({ ...f, lessonNumber: Number(e.target.value) }))
            }
            required
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Título</Label>
          <Input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Textarea
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value || null }))
          }
          rows={2}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Fecha/hora (local)</Label>
          <Input
            type="datetime-local"
            value={form.scheduledAt ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, scheduledAt: e.target.value || null }))
            }
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">URL de grabación</Label>
          <Input
            type="url"
            value={form.recordingUrl ?? ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, recordingUrl: e.target.value || null }))
            }
            placeholder="https://…"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Guardando…" : lesson ? "Guardar" : "Crear"}
        </Button>
      </div>
    </form>
  );
}
