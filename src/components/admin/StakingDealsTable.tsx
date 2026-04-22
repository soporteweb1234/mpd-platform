"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Plus, Play, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StakingDealDialog } from "./StakingDealDialog";
import {
  activateStakingDeal,
  cancelStakingDeal,
} from "@/lib/actions/admin-staking";
import type { StakingStatus } from "@prisma/client";

export type AdminStakingDeal = {
  id: string;
  userId: string;
  user: { id: string; name: string | null; email: string } | null;
  totalBankroll: number;
  mpdContribution: number;
  playerContribution: number;
  profitSplitMpd: number;
  profitSplitPlayer: number;
  status: StakingStatus;
  startDate: string | null;
  endDate: string | null;
  currentMakeup: number;
  totalProfit: number;
  totalLoss: number;
  notes: string | null;
  createdAt: string;
  periodsCount: number;
};

export type UserOption = {
  id: string;
  name: string | null;
  email: string;
};

const STATUS_LABEL: Record<StakingStatus, string> = {
  PROPOSED: "Propuesta",
  ACTIVE: "Activo",
  SETTLED: "Liquidado",
  CANCELLED: "Cancelado",
  DEFAULTED: "Default",
};

const STATUS_VARIANT: Record<
  StakingStatus,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  PROPOSED: "warning",
  ACTIVE: "success",
  SETTLED: "secondary",
  CANCELLED: "outline",
  DEFAULTED: "destructive",
};

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function StakingDealsTable({
  deals,
  users,
}: {
  deals: AdminStakingDeal[];
  users: UserOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<AdminStakingDeal | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<"" | StakingStatus>("");

  const filtered = deals.filter(
    (d) => !statusFilter || d.status === statusFilter,
  );

  async function onActivate(id: string) {
    setPendingId(id);
    try {
      const res = await activateStakingDeal(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deal activado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  async function onCancel(id: string) {
    if (!confirm("¿Cancelar este deal? No podrá reactivarse.")) return;
    setPendingId(id);
    try {
      const res = await cancelStakingDeal(id);
      if (res.error) toast.error(res.error);
      else {
        toast.success("Deal cancelado");
        router.refresh();
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "" | StakingStatus)
            }
            className="h-9 rounded-lg border border-mpd-border bg-mpd-surface px-2 text-xs text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <span className="text-xs text-mpd-gray">
            {filtered.length} / {deals.length}
          </span>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo deal
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mpd-border bg-mpd-black/40">
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Jugador</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Bankroll</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Make-up</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Split</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Estado</th>
              <th className="text-center py-2 px-3 text-mpd-gray font-medium">Periodos</th>
              <th className="text-left py-2 px-3 text-mpd-gray font-medium">Creado</th>
              <th className="text-right py-2 px-3 text-mpd-gray font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-mpd-border/30">
                <td className="py-2 px-3">
                  <p className="text-mpd-white font-medium">
                    {d.user?.name ?? d.user?.email ?? "—"}
                  </p>
                  {d.user?.name && (
                    <p className="text-[11px] text-mpd-gray">{d.user.email}</p>
                  )}
                </td>
                <td className="py-2 px-3 text-right font-mono text-mpd-white">
                  {fmtMoney(d.totalBankroll)}
                </td>
                <td className="py-2 px-3 text-right font-mono">
                  <span
                    className={
                      d.currentMakeup > 0 ? "text-mpd-amber" : "text-mpd-gray"
                    }
                  >
                    {fmtMoney(d.currentMakeup)}
                  </span>
                </td>
                <td className="py-2 px-3 text-center text-[11px] text-mpd-gray">
                  {d.profitSplitMpd}/{d.profitSplitPlayer}
                </td>
                <td className="py-2 px-3 text-center">
                  <Badge
                    variant={STATUS_VARIANT[d.status]}
                    className="text-[10px]"
                  >
                    {STATUS_LABEL[d.status]}
                  </Badge>
                </td>
                <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                  {d.periodsCount}
                </td>
                <td className="py-2 px-3 text-xs text-mpd-gray font-mono">
                  {format(new Date(d.createdAt), "dd/MM/yy", { locale: es })}
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="inline-flex gap-1">
                    {d.status === "PROPOSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onActivate(d.id)}
                        disabled={pendingId === d.id}
                        aria-label="Activar"
                        title="Activar"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(d.status === "PROPOSED" || d.status === "ACTIVE") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(d)}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {(d.status === "PROPOSED" || d.status === "ACTIVE") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCancel(d.id)}
                        disabled={pendingId === d.id}
                        aria-label="Cancelar"
                        title="Cancelar"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/staking/${d.id}`} aria-label="Detalle">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 px-3 text-center text-xs text-mpd-gray"
                >
                  Sin resultados con los filtros actuales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {creating && (
        <StakingDealDialog
          mode="create"
          users={users}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}

      {editing && (
        <StakingDealDialog
          mode="edit"
          users={users}
          deal={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
