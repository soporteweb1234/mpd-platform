"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveSystemPrompt } from "@/lib/actions/admin-chat";

interface Props {
  initialValue: string;
}

export function SystemPromptEditor({ initialValue }: Props) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  const onSave = () => {
    startTransition(async () => {
      const res = await saveSystemPrompt(value);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("System prompt guardado. Los próximos mensajes del chat lo usarán (cache 60s).");
      setDirty(false);
    });
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setDirty(true);
        }}
        rows={14}
        className="font-mono text-xs"
        placeholder="Personalidad + reglas + formato de MIKE…"
      />
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-mpd-gray">
          {value.length.toLocaleString()} caracteres · cache 60s tras guardar
        </p>
        <Button size="sm" onClick={onSave} disabled={pending || !dirty}>
          {pending ? "Guardando…" : "Guardar system prompt"}
        </Button>
      </div>
    </div>
  );
}
