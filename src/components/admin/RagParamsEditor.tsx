"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveChatParam } from "@/lib/actions/admin-chat";

interface Props {
  initial: {
    escalationThreshold: string;
    topKVector: string;
    topKFinal: string;
    model: string;
  };
}

type Key =
  | "chat.escalation_threshold"
  | "chat.topk_vector"
  | "chat.topk_final"
  | "chat.model";

const FIELDS: {
  key: Key;
  label: string;
  hint: string;
  type: "number" | "text";
  step?: string;
}[] = [
  {
    key: "chat.escalation_threshold",
    label: "Umbral de escalation",
    hint: "0–1. Si similitud máxima < umbral → banner de ticket.",
    type: "number",
    step: "0.01",
  },
  {
    key: "chat.topk_vector",
    label: "Top-K por canal (vector + FTS)",
    hint: "Candidatos que pedimos a cada canal antes de fusionar.",
    type: "number",
  },
  {
    key: "chat.topk_final",
    label: "Top-K final tras RRF",
    hint: "Chunks fusionados inyectados en <context>.",
    type: "number",
  },
  {
    key: "chat.model",
    label: "Modelo Anthropic",
    hint: "Ej: claude-haiku-4-5-20251001",
    type: "text",
  },
];

export function RagParamsEditor({ initial }: Props) {
  const [values, setValues] = useState<Record<Key, string>>({
    "chat.escalation_threshold": initial.escalationThreshold,
    "chat.topk_vector": initial.topKVector,
    "chat.topk_final": initial.topKFinal,
    "chat.model": initial.model,
  });
  const [pending, startTransition] = useTransition();

  const saveOne = (key: Key) => {
    startTransition(async () => {
      const res = await saveChatParam(key, values[key]);
      if (res.error) toast.error(`${key}: ${res.error}`);
      else toast.success(`${key.replace("chat.", "")} actualizado.`);
    });
  };

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div
          key={f.key}
          className="flex flex-col md:flex-row md:items-end gap-2 md:gap-3"
        >
          <div className="flex-1 space-y-1">
            <Label className="text-xs text-mpd-white">{f.label}</Label>
            <Input
              type={f.type}
              step={f.step}
              value={values[f.key]}
              onChange={(e) =>
                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
              }
              className="text-xs"
            />
            <p className="text-[10px] text-mpd-gray">{f.hint}</p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => saveOne(f.key)}
            disabled={pending}
          >
            Guardar
          </Button>
        </div>
      ))}
    </div>
  );
}
