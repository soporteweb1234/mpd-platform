"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserBalances } from "@/lib/actions/admin";

export function AdjustBalanceForm({
  userId,
  current,
}: {
  userId: string;
  current: {
    availableBalance: number;
    pendingBalance: number;
    totalRakeback: number;
    investedBalance: number;
  };
}) {
  const router = useRouter();
  const [available, setAvailable] = React.useState(current.availableBalance);
  const [pending, setPending] = React.useState(current.pendingBalance);
  const [total, setTotal] = React.useState(current.totalRakeback);
  const [invested, setInvested] = React.useState(current.investedBalance);
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (
      !confirm(
        `¿Aplicar ajuste?\n  Available: ${current.availableBalance} → ${available}\n  Pending: ${current.pendingBalance} → ${pending}\n  TotalRakeback: ${current.totalRakeback} → ${total}\n  Invested: ${current.investedBalance} → ${invested}`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      const res = await updateUserBalances({
        userId,
        availableBalance: available,
        pendingBalance: pending,
        totalRakeback: total,
        investedBalance: invested,
      });
      if ("error" in res) {
        toast.error(res.error as string);
        return;
      }
      toast.success("Saldos actualizados");
      router.push(`/admin/users/${userId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <BalanceField
          label="Disponible"
          value={available}
          setValue={setAvailable}
          current={current.availableBalance}
        />
        <BalanceField
          label="Pendiente"
          value={pending}
          setValue={setPending}
          current={current.pendingBalance}
        />
        <BalanceField
          label="Rakeback total (histórico)"
          value={total}
          setValue={setTotal}
          current={current.totalRakeback}
        />
        <BalanceField
          label="Invertido (staking)"
          value={invested}
          setValue={setInvested}
          current={current.investedBalance}
        />
      </div>
      <p className="text-[11px] text-mpd-amber">
        Ajuste directo registrado en ActivityLog. Usa con moderación — prefiere operaciones
        con ledger (rakeback, milestones, refunds).
      </p>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Aplicando..." : "Aplicar ajuste"}
        </Button>
      </div>
    </form>
  );
}

function BalanceField({
  label,
  value,
  setValue,
  current,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  current: number;
}) {
  const delta = value - current;
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
      />
      <p className="text-[10px] text-mpd-gray">
        Actual: ${current.toFixed(2)} · Delta:{" "}
        <span className={delta === 0 ? "text-mpd-gray" : delta > 0 ? "text-mpd-green" : "text-mpd-amber"}>
          {delta > 0 ? "+" : ""}
          {delta.toFixed(2)}
        </span>
      </p>
    </div>
  );
}
