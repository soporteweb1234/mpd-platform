"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Power, Trash2 } from "lucide-react";
import {
  toggleReferralCommission,
  deleteReferralCommission,
} from "@/lib/actions/admin-referrals";

export function ReferralCommissionRowActions({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const router = useRouter();
  const [isToggling, startToggle] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const onToggle = () => {
    startToggle(async () => {
      const res = await toggleReferralCommission(id, !active);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(active ? "Comisión desactivada" : "Comisión activada");
      router.refresh();
    });
  };

  const onDelete = () => {
    if (!confirm("¿Eliminar esta comisión?")) return;
    startDelete(async () => {
      const res = await deleteReferralCommission(id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Comisión eliminada");
      router.refresh();
    });
  };

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        disabled={isToggling}
        title={active ? "Desactivar" : "Activar"}
      >
        <Power className="h-3.5 w-3.5" />
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
  );
}
