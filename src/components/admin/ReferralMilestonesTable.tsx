"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createMilestone,
  updateMilestone,
  toggleMilestone,
  deleteMilestone,
} from "@/lib/actions/admin-milestones";

export type MilestoneRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  threshold: number;
  metric: string;
  bonusAmount: number;
  active: boolean;
  awardCount: number;
  createdAt: string;
};

const METRIC_LABEL: Record<string, string> = {
  lifetime_rakeback: "Rakeback acumulado",
  active_days: "Días activos",
  first_deposit: "Primer depósito",
};

export function ReferralMilestonesTable({
  milestones,
}: {
  milestones: MilestoneRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<MilestoneRow | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function onToggle(id: string, active: boolean) {
    setPendingId(id);
    try {
      const res = await toggleMilestone(id, active);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success(active ? "Activado" : "Desactivado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar milestone? Los awards ya otorgados no se revierten.")) return;
    setPendingId(id);
    try {
      const res = await deleteMilestone(id);
      if ("error" in res) toast.error(res.error);
      else {
        toast.success("Eliminado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo milestone
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/40">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Code</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Label</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Métrica</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Threshold</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Bonus</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Awards</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Estado</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {milestones.map((m) => (
              <tr key={m.id} className="border-b border-mpd-border/30">
                <td className="py-2 px-3 font-mono text-xs text-mpd-gray">{m.code}</td>
                <td className="py-2 px-3 text-mpd-white">{m.label}</td>
                <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                  {METRIC_LABEL[m.metric] ?? m.metric}
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-white">
                  ${m.threshold.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-gold">
                  +${m.bonusAmount.toFixed(2)}
                </td>
                <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                  {m.awardCount}
                </td>
                <td className="py-2 px-3 text-center">
                  <Badge variant={m.active ? "success" : "outline"} className="text-[10px]">
                    {m.active ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggle(m.id, !m.active)}
                      disabled={pendingId === m.id}
                    >
                      {m.active ? "Pausar" : "Activar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(m)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(m.id)}
                      disabled={pendingId === m.id}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <MilestoneDialog
          mode={editing ? "edit" : "create"}
          milestone={editing ?? undefined}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function MilestoneDialog({
  mode,
  milestone,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  milestone?: MilestoneRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [code, setCode] = React.useState(milestone?.code ?? "");
  const [label, setLabel] = React.useState(milestone?.label ?? "");
  const [description, setDescription] = React.useState(milestone?.description ?? "");
  const [threshold, setThreshold] = React.useState(milestone?.threshold ?? 100);
  const [metric, setMetric] = React.useState<
    "lifetime_rakeback" | "active_days" | "first_deposit"
  >((milestone?.metric as "lifetime_rakeback") ?? "lifetime_rakeback");
  const [bonusAmount, setBonusAmount] = React.useState(milestone?.bonusAmount ?? 10);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const payload = {
        code: code.trim(),
        label: label.trim(),
        description: description.trim(),
        threshold,
        metric,
        bonusAmount,
      };
      const res =
        mode === "create"
          ? await createMilestone(payload)
          : await updateMilestone(milestone!.id, payload);
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === "create" ? "Milestone creado" : "Actualizado");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-mpd-border bg-mpd-surface shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-mpd-border p-4">
          <h3 className="text-base font-semibold text-mpd-white">
            {mode === "create" ? "Nuevo milestone" : "Editar milestone"}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Cerrar">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Code (slug único) *</Label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="first_100_rb"
              required
              disabled={mode === "edit"}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Label *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Primer $100 de rakeback"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Descripción (opcional)</Label>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Métrica *</Label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as "lifetime_rakeback")}
                className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
              >
                <option value="lifetime_rakeback">Rakeback acumulado</option>
                <option value="active_days">Días activos (futuro)</option>
                <option value="first_deposit">Primer depósito (futuro)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Threshold (USD) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bonus (USD) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-mpd-border pt-4">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Guardando…" : mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
