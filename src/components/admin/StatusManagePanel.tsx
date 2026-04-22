"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  setStatusLevel,
  setPrestigeScore,
  setReputationScore,
} from "@/lib/actions/admin-status";
import type { StatusLevel } from "@prisma/client";

const LEVELS: StatusLevel[] = [
  "APRENDIZ",
  "VERSADO",
  "PROFESIONAL",
  "EXPERTO",
  "MAESTRO",
];

const LEVEL_LABELS: Record<StatusLevel, string> = {
  APRENDIZ: "1 · Aprendiz",
  VERSADO: "2 · Versado",
  PROFESIONAL: "3 · Profesional",
  EXPERTO: "4 · Experto",
  MAESTRO: "5 · Maestro",
};

export function StatusManagePanel({
  userId,
  statusLevel,
  prestigeScore,
  reputationScore,
}: {
  userId: string;
  statusLevel: StatusLevel;
  prestigeScore: number;
  reputationScore: number;
}) {
  const router = useRouter();
  const [level, setLevel] = useState<StatusLevel>(statusLevel);
  const [prestige, setPrestige] = useState(String(prestigeScore));
  const [reputation, setReputation] = useState(String(reputationScore));

  const [isSavingLevel, startLevel] = useTransition();
  const [isSavingPrestige, startPrestige] = useTransition();
  const [isSavingReputation, startReputation] = useTransition();

  const saveLevel = () => {
    startLevel(async () => {
      const res = await setStatusLevel(userId, level);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Nivel actualizado");
      router.refresh();
    });
  };

  const savePrestige = () => {
    startPrestige(async () => {
      const res = await setPrestigeScore(userId, Number(prestige) || 0);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Prestigio actualizado");
      router.refresh();
    });
  };

  const saveReputation = () => {
    startReputation(async () => {
      const res = await setReputationScore(userId, Number(reputation) || 0);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Reputación actualizada");
      router.refresh();
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Nivel status (galones)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Nivel</Label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as StatusLevel)}
            className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {LEVEL_LABELS[l]}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            className="w-full"
            onClick={saveLevel}
            disabled={isSavingLevel || level === statusLevel}
          >
            {isSavingLevel ? "Guardando…" : "Aplicar nivel"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prestigio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Puntos (0–100.000)</Label>
          <Input
            type="number"
            min={0}
            max={100000}
            value={prestige}
            onChange={(e) => setPrestige(e.target.value)}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={savePrestige}
            disabled={isSavingPrestige || Number(prestige) === prestigeScore}
          >
            {isSavingPrestige ? "Guardando…" : "Aplicar prestigio"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Reputación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Puntos</Label>
          <Input
            type="number"
            value={reputation}
            onChange={(e) => setReputation(e.target.value)}
          />
          <Button
            size="sm"
            className="w-full"
            onClick={saveReputation}
            disabled={isSavingReputation || Number(reputation) === reputationScore}
          >
            {isSavingReputation ? "Guardando…" : "Aplicar reputación"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
