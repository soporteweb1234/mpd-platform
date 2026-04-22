"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Play, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  activateStakingDeal,
  settleStakingDeal,
  cancelStakingDeal,
  defaultStakingDeal,
} from "@/lib/actions/admin-staking";
import type { StakingStatus } from "@prisma/client";

export function StakingDealActions({
  id,
  status,
  userEmail,
}: {
  id: string;
  status: StakingStatus;
  userEmail: string;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  async function run(
    label: string,
    fn: () => Promise<{ ok?: true; error?: string }>,
    successMsg: string,
    confirmMsg?: string,
  ) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setPending(label);
    try {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(successMsg);
        router.refresh();
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "PROPOSED" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() =>
            run(
              "activate",
              () => activateStakingDeal(id),
              "Deal activado",
              `¿Activar deal para ${userEmail}? El jugador podrá empezar a registrar periodos.`,
            )
          }
        >
          <Play className="h-3.5 w-3.5 mr-1" /> Activar
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() =>
            run(
              "settle",
              () => settleStakingDeal(id),
              "Deal liquidado",
              "¿Liquidar deal? No podrán añadirse más periodos.",
            )
          }
        >
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Liquidar
        </Button>
      )}
      {(status === "PROPOSED" || status === "ACTIVE") && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() =>
            run(
              "cancel",
              () => cancelStakingDeal(id),
              "Deal cancelado",
              "¿Cancelar deal? Esta acción es definitiva.",
            )
          }
        >
          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
        </Button>
      )}
      {status === "ACTIVE" && (
        <Button
          variant="outline"
          size="sm"
          disabled={pending !== null}
          onClick={() => {
            const reason = prompt("Motivo del default (opcional)") ?? undefined;
            run(
              "default",
              () => defaultStakingDeal(id, reason),
              "Deal marcado como default",
            );
          }}
        >
          <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Default
        </Button>
      )}
    </div>
  );
}
