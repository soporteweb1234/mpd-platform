"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createCourse,
  updateCourse,
  deleteCourse,
  type CourseInput,
} from "@/lib/actions/admin-courses";
import type { CourseStatus, PlayerStratum } from "@prisma/client";

type TeacherOption = { id: string; name: string; email: string };

type Props =
  | { mode: "create"; course?: never; teachers: TeacherOption[] }
  | {
      mode: "edit";
      course: CourseInput & { id: string; enrollmentsCount: number };
      teachers: TeacherOption[];
    };

const STATUSES: CourseStatus[] = [
  "DRAFT",
  "OPEN_ENROLLMENT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

const STATUS_LABELS: Record<CourseStatus, string> = {
  DRAFT: "Borrador",
  OPEN_ENROLLMENT: "Inscripción abierta",
  IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
};

const STRATA: PlayerStratum[] = ["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"];

function isoDate(d?: string | null | Date) {
  if (!d) return "";
  const dd = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dd.getTime())) return "";
  return dd.toISOString().slice(0, 10);
}

export function CourseEditForm(props: Props) {
  const router = useRouter();
  const defaults: CourseInput =
    props.mode === "edit"
      ? {
          title: props.course.title,
          slug: props.course.slug,
          description: props.course.description,
          teacherId: props.course.teacherId,
          coverImageUrl: props.course.coverImageUrl,
          tagline: props.course.tagline,
          priceEur: props.course.priceEur,
          priceWithAffiliation: props.course.priceWithAffiliation,
          maxStudents: props.course.maxStudents,
          durationWeeks: props.course.durationWeeks,
          trialWeeks: props.course.trialWeeks,
          startDate: isoDate(props.course.startDate),
          endDate: isoDate(props.course.endDate),
          schedule: props.course.schedule,
          status: props.course.status,
          requiredStratum: props.course.requiredStratum,
          requiresAffiliation: props.course.requiresAffiliation,
        }
      : {
          title: "",
          slug: "",
          description: "",
          teacherId: null,
          coverImageUrl: null,
          tagline: null,
          priceEur: 0,
          priceWithAffiliation: null,
          maxStudents: 12,
          durationWeeks: 12,
          trialWeeks: 2,
          startDate: null,
          endDate: null,
          schedule: null,
          status: "DRAFT",
          requiredStratum: null,
          requiresAffiliation: true,
        };

  const [form, setForm] = useState<CourseInput>(defaults);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const set = <K extends keyof CourseInput>(key: K, value: CourseInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const res =
        props.mode === "edit"
          ? await updateCourse(props.course.id, form)
          : await createCourse(form);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(props.mode === "edit" ? "Curso actualizado" : "Curso creado");
      if (props.mode === "create" && "id" in res && res.id) {
        router.push(`/admin/cursos/${res.id}`);
      } else {
        router.refresh();
      }
    });
  };

  const onDelete = () => {
    if (props.mode !== "edit") return;
    const soft = props.course.enrollmentsCount > 0;
    const label = soft
      ? "¿Cancelar curso? Tiene inscripciones — quedará marcado como CANCELLED."
      : "¿Eliminar curso? Esta acción no tiene inscripciones y borrará el registro.";
    if (!confirm(label)) return;
    startDelete(async () => {
      const res = await deleteCourse(props.course.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(soft ? "Curso cancelado" : "Curso eliminado");
      router.push("/admin/cursos");
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Título</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} required />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Tagline</Label>
          <Input
            value={form.tagline ?? ""}
            onChange={(e) => set("tagline", e.target.value || null)}
            placeholder="Frase corta comercial"
            maxLength={160}
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Descripción</Label>
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={4}
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Cover image (URL)</Label>
          <Input
            type="url"
            value={form.coverImageUrl ?? ""}
            onChange={(e) => set("coverImageUrl", e.target.value || null)}
            placeholder="https://…"
          />
        </div>
        <div className="space-y-2">
          <Label>Profesor</Label>
          <select
            value={form.teacherId ?? ""}
            onChange={(e) => set("teacherId", e.target.value || null)}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">— Sin asignar —</option>
            {props.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.email})
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <select
            value={form.status}
            onChange={(e) => set("status", e.target.value as CourseStatus)}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Precio (€)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={form.priceEur}
            onChange={(e) => set("priceEur", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Precio con afiliación (€)</Label>
          <Input
            type="number"
            step="0.01"
            min={0}
            value={form.priceWithAffiliation ?? ""}
            onChange={(e) =>
              set(
                "priceWithAffiliation",
                e.target.value === "" ? null : Number(e.target.value),
              )
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Max estudiantes</Label>
          <Input
            type="number"
            min={1}
            max={200}
            value={form.maxStudents}
            onChange={(e) => set("maxStudents", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Duración (semanas)</Label>
          <Input
            type="number"
            min={1}
            max={104}
            value={form.durationWeeks}
            onChange={(e) => set("durationWeeks", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Trial (semanas)</Label>
          <Input
            type="number"
            min={0}
            max={form.durationWeeks}
            value={form.trialWeeks}
            onChange={(e) => set("trialWeeks", Number(e.target.value))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input
            type="date"
            value={form.startDate ?? ""}
            onChange={(e) => set("startDate", e.target.value || null)}
          />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input
            type="date"
            value={form.endDate ?? ""}
            onChange={(e) => set("endDate", e.target.value || null)}
          />
        </div>
        <div className="space-y-2">
          <Label>Horario</Label>
          <Input
            value={form.schedule ?? ""}
            onChange={(e) => set("schedule", e.target.value || null)}
            placeholder="Ma/Ju 20:00 CET"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estrato requerido</Label>
          <select
            value={form.requiredStratum ?? ""}
            onChange={(e) =>
              set("requiredStratum", (e.target.value || null) as PlayerStratum | null)
            }
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">— Cualquiera —</option>
            {STRATA.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 self-end">
          <input
            type="checkbox"
            checked={form.requiresAffiliation}
            onChange={(e) => set("requiresAffiliation", e.target.checked)}
            className="h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
          />
          <span className="text-sm text-mpd-white">Requiere afiliación a sala MPD</span>
        </label>
      </section>

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-mpd-border">
        {props.mode === "edit" ? (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? "Procesando…"
              : props.course.enrollmentsCount > 0
                ? "Cancelar curso"
                : "Eliminar curso"}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Guardando…"
            : props.mode === "edit"
              ? "Guardar cambios"
              : "Crear curso"}
        </Button>
      </div>
    </form>
  );
}
