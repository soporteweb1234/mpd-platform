"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, Eye, X } from "lucide-react";
import { reviewBankingCandidate } from "@/lib/actions/admin-banking";
import type { BankingCandidateStatus } from "@prisma/client";

type Decision = Exclude<BankingCandidateStatus, "PENDING">;

export function BankingCandidateReview({
  candidateId,
  currentStatus,
  currentNotes,
}: {
  candidateId: string;
  currentStatus: BankingCandidateStatus;
  currentNotes: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(currentNotes ?? "");

  const submit = (decision: Decision) => {
    if (decision === "REJECTED" && !notes.trim()) {
      toast.error("Añade una nota explicando el rechazo");
      return;
    }
    startTransition(async () => {
      const res = await reviewBankingCandidate({
        candidateId,
        decision,
        notes: notes.trim() || undefined,
      });
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(
        decision === "APPROVED"
          ? "Candidatura aprobada"
          : decision === "REJECTED"
            ? "Candidatura rechazada"
            : "Candidatura en revisión",
      );
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs">Notas internas</Label>
        <Textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
          placeholder="Criterios, volumen, condiciones, etc."
        />
        <p className="text-[11px] text-mpd-gray">{notes.length}/1000</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={isPending || currentStatus === "REVIEWING"}
          onClick={() => submit("REVIEWING")}
        >
          <Eye className="h-3.5 w-3.5 mr-1" /> En revisión
        </Button>
        <Button
          size="sm"
          disabled={isPending || currentStatus === "APPROVED"}
          onClick={() => submit("APPROVED")}
          className="bg-mpd-green/20 text-mpd-green border-mpd-green/40 hover:bg-mpd-green/30"
        >
          <Check className="h-3.5 w-3.5 mr-1" /> Aprobar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          disabled={isPending || currentStatus === "REJECTED"}
          onClick={() => submit("REJECTED")}
        >
          <X className="h-3.5 w-3.5 mr-1" /> Rechazar
        </Button>
      </div>
    </div>
  );
}
