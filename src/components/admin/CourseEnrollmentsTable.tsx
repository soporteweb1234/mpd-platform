"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  enrollUser,
  updateEnrollmentStatus,
  cancelEnrollment,
} from "@/lib/actions/admin-courses";
import type { EnrollmentStatus } from "@prisma/client";
import { Plus, UserMinus } from "lucide-react";

type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  paidAmount: number;
  paidWithBalance: boolean;
  enrolledAt: Date | string;
  user: { id: string; name: string; email: string };
};

type UserOption = { id: string; name: string; email: string };

const STATUSES: EnrollmentStatus[] = [
  "TRIAL",
  "ENROLLED",
  "COMPLETED",
  "DROPPED",
  "EXPELLED",
];

const STATUS_VARIANT: Record<
  EnrollmentStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  TRIAL: "warning",
  ENROLLED: "default",
  COMPLETED: "success",
  DROPPED: "secondary",
  EXPELLED: "destructive",
};

export function CourseEnrollmentsTable({
  courseId,
  enrollments,
  availableUsers,
  seatsLeft,
}: {
  courseId: string;
  enrollments: Enrollment[];
  availableUsers: UserOption[];
  seatsLeft: number;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-mpd-gray">
          {enrollments.length} inscripciones · {seatsLeft} plazas libres
        </p>
        {!adding && seatsLeft > 0 && (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Añadir jugador
          </Button>
        )}
      </div>

      {adding && (
        <EnrollmentCreateRow
          courseId={courseId}
          availableUsers={availableUsers}
          onDone={() => setAdding(false)}
        />
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/30">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Jugador</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Estado</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Pagado</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Origen</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Fecha</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e) => (
              <EnrollmentRow key={e.id} enrollment={e} />
            ))}
            {enrollments.length === 0 && !adding && (
              <tr>
                <td
                  colSpan={6}
                  className="py-6 text-center text-sm text-mpd-gray"
                >
                  Sin inscripciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EnrollmentRow({ enrollment }: { enrollment: Enrollment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCancelling, startCancel] = useTransition();

  const changeStatus = (status: EnrollmentStatus) => {
    startTransition(async () => {
      const res = await updateEnrollmentStatus(enrollment.id, status);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Estado actualizado");
      router.refresh();
    });
  };

  const onCancel = () => {
    if (!confirm(`¿Eliminar la inscripción de ${enrollment.user.name}?`)) return;
    startCancel(async () => {
      const res = await cancelEnrollment(enrollment.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Inscripción eliminada");
      router.refresh();
    });
  };

  return (
    <tr className="border-b border-mpd-border/30">
      <td className="py-2 px-3 text-mpd-white">
        <p>{enrollment.user.name}</p>
        <p className="text-[11px] text-mpd-gray">{enrollment.user.email}</p>
      </td>
      <td className="py-2 px-3 text-center">
        <select
          value={enrollment.status}
          onChange={(e) => changeStatus(e.target.value as EnrollmentStatus)}
          disabled={isPending}
          className="rounded border border-mpd-border bg-mpd-surface px-2 py-1 text-xs text-mpd-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <div className="mt-1">
          <Badge variant={STATUS_VARIANT[enrollment.status]} className="text-[10px]">
            {enrollment.status}
          </Badge>
        </div>
      </td>
      <td className="py-2 px-3 text-right font-mono text-mpd-white">
        {enrollment.paidAmount.toFixed(2)} €
      </td>
      <td className="py-2 px-3 text-center text-xs text-mpd-gray">
        {enrollment.paidWithBalance ? "Saldo MPD" : "Externo"}
      </td>
      <td className="py-2 px-3 text-right text-xs text-mpd-gray">
        {new Date(enrollment.enrolledAt).toLocaleDateString("es-ES")}
      </td>
      <td className="py-2 px-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isCancelling}
          className="text-mpd-amber hover:text-mpd-amber"
        >
          <UserMinus className="h-3.5 w-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function EnrollmentCreateRow({
  courseId,
  availableUsers,
  onDone,
}: {
  courseId: string;
  availableUsers: UserOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [userId, setUserId] = useState("");
  const [paidAmount, setPaidAmount] = useState("0");
  const [paidWithBalance, setPaidWithBalance] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Selecciona un jugador");
      return;
    }
    startTransition(async () => {
      const res = await enrollUser(
        courseId,
        userId,
        Number(paidAmount) || 0,
        paidWithBalance,
      );
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Jugador inscrito");
      onDone();
      router.refresh();
    });
  };

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-mpd-gold/40 bg-mpd-surface/50 p-3 grid grid-cols-1 md:grid-cols-[2fr_1fr_auto_auto] gap-3 items-end"
    >
      <div className="space-y-1">
        <label className="text-xs text-mpd-gray">Jugador</label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
        >
          <option value="">— Seleccionar —</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-mpd-gray">Pagado (€)</label>
        <Input
          type="number"
          step="0.01"
          min={0}
          value={paidAmount}
          onChange={(e) => setPaidAmount(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 pb-2">
        <input
          type="checkbox"
          checked={paidWithBalance}
          onChange={(e) => setPaidWithBalance(e.target.checked)}
          className="h-4 w-4 rounded border-mpd-border text-mpd-gold focus:ring-mpd-gold"
        />
        <span className="text-xs text-mpd-white">Saldo MPD</span>
      </label>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "…" : "Añadir"}
        </Button>
      </div>
    </form>
  );
}
