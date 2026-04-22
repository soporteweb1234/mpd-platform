"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Loader2, Check } from "lucide-react";
import { updateAdminNotes } from "@/lib/actions/admin";

const MAX_LEN = 4000;
const DEBOUNCE_MS = 800;

export function AdminNotesCard({
  userId,
  initialNotes,
}: {
  userId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notes === savedNotes) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await updateAdminNotes(userId, notes);
        if (res && "error" in res) {
          toast.error(res.error);
          return;
        }
        setSavedNotes(notes);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1800);
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notes, savedNotes, userId]);

  const dirty = notes !== savedNotes;
  const remaining = MAX_LEN - notes.length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-mpd-gold" />
          Notas comerciales
        </CardTitle>
        <div className="text-xs flex items-center gap-2 text-mpd-gray">
          {isPending ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Guardando…
            </>
          ) : justSaved ? (
            <>
              <Check className="h-3 w-3 text-mpd-green" />
              <span className="text-mpd-green">Guardado</span>
            </>
          ) : dirty ? (
            <span className="text-mpd-amber">Sin guardar</span>
          ) : (
            <span>Privadas · solo admin</span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, MAX_LEN))}
          placeholder="Historial de conversaciones, acuerdos, contexto comercial del jugador… (no visible para el usuario)"
          className="min-h-[140px] font-mono text-sm"
          maxLength={MAX_LEN}
        />
        <div className="flex justify-between text-[11px] text-mpd-gray">
          <span>Guardado automático al dejar de escribir</span>
          <span className={remaining < 200 ? "text-mpd-amber" : ""}>
            {remaining} caracteres restantes
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
