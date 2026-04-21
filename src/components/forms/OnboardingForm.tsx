"use client";

import { useState, useTransition } from "react";
import { updateOnboarding } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type InitialData = {
  country: string;
  playingLevel: string;
  primaryRoom: string;
  secondaryRooms: string[];
  weeklyHours: number | null;
  goals: string[];
  nickname: string;
};

const COUNTRIES = [
  "España",
  "México",
  "Argentina",
  "Colombia",
  "Chile",
  "Perú",
  "Venezuela",
  "Uruguay",
  "Ecuador",
  "Bolivia",
  "Paraguay",
  "Otros",
];

const LEVELS = [
  { value: "MICRO", label: "NL2 - NL10 (Micro)" },
  { value: "LOW", label: "NL25 - NL50 (Low)" },
  { value: "MID", label: "NL100 - NL200 (Mid)" },
  { value: "HIGH", label: "NL500+ (High)" },
];

const ROOMS = ["PokerStars", "GGPoker", "888poker", "WPT Global", "iPoker", "Otras"];

const GOALS = [
  { value: "RAKEBACK", label: "Maximizar rakeback" },
  { value: "COACHING", label: "Acceder a coaching" },
  { value: "COMMUNITY", label: "Formar parte de una comunidad" },
  { value: "TOOLS", label: "Herramientas y datamining" },
  { value: "BANKROLL", label: "Gestión de bankroll / bancaje" },
  { value: "LEVEL_UP", label: "Subir de nivel y estratos" },
];

export function OnboardingForm({
  userId,
  initialStep,
  initialData,
}: {
  userId: string;
  initialStep: number;
  initialData: InitialData;
}) {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<InitialData>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitStep(targetStep: number) {
    setError(null);

    const payload: Record<string, unknown> = {};
    if (targetStep === 1) {
      if (!data.country) return setError("Selecciona tu país");
      if (!data.playingLevel) return setError("Selecciona tu nivel de juego");
      payload.country = data.country;
      payload.playingLevel = data.playingLevel;
    } else if (targetStep === 2) {
      if (!data.primaryRoom) return setError("Selecciona tu sala principal");
      if (!data.weeklyHours || data.weeklyHours <= 0)
        return setError("Indica tus horas semanales");
      payload.primaryRoom = data.primaryRoom;
      payload.secondaryRooms = data.secondaryRooms;
      payload.weeklyHours = data.weeklyHours;
    } else if (targetStep === 3) {
      if (data.goals.length === 0) return setError("Selecciona al menos un objetivo");
      payload.goals = data.goals;
      if (data.nickname) payload.nickname = data.nickname;
    }

    startTransition(async () => {
      try {
        await updateOnboarding(userId, targetStep, payload);
        if (targetStep < 3) setStep(targetStep + 1);
      } catch (e) {
        if (e instanceof Error && e.message.includes("NEXT_REDIRECT")) {
          return;
        }
        setError("No pudimos guardar tu información. Intenta de nuevo.");
      }
    });
  }

  function toggleSecondaryRoom(room: string) {
    setData((d) => ({
      ...d,
      secondaryRooms: d.secondaryRooms.includes(room)
        ? d.secondaryRooms.filter((r) => r !== room)
        : [...d.secondaryRooms, room],
    }));
  }

  function toggleGoal(goal: string) {
    setData((d) => ({
      ...d,
      goals: d.goals.includes(goal) ? d.goals.filter((g) => g !== goal) : [...d.goals, goal],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border",
                step > s
                  ? "bg-mpd-gold text-mpd-black border-mpd-gold"
                  : step === s
                    ? "bg-mpd-gold/20 text-mpd-gold border-mpd-gold"
                    : "bg-mpd-surface text-mpd-gray border-mpd-border"
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "flex-1 h-0.5 rounded-full",
                  step > s ? "bg-mpd-gold" : "bg-mpd-border"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-mpd-red/10 border border-mpd-red/20 text-sm text-mpd-red">
          {error}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>País</Label>
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, country: c }))}
                  className={cn(
                    "p-2 rounded-lg border text-sm transition-colors",
                    data.country === c
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Nivel de juego</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, playingLevel: l.value }))}
                  className={cn(
                    "p-3 rounded-lg border text-sm text-left transition-colors",
                    data.playingLevel === l.value
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Sala principal</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROOMS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setData((d) => ({ ...d, primaryRoom: r }))}
                  className={cn(
                    "p-3 rounded-lg border text-sm transition-colors",
                    data.primaryRoom === r
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Salas secundarias (opcional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {ROOMS.filter((r) => r !== data.primaryRoom).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleSecondaryRoom(r)}
                  className={cn(
                    "p-2 rounded-lg border text-sm transition-colors",
                    data.secondaryRooms.includes(r)
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weeklyHours">Horas semanales</Label>
            <Input
              id="weeklyHours"
              type="number"
              min={1}
              max={168}
              placeholder="Ej: 20"
              value={data.weeklyHours ?? ""}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  weeklyHours: e.target.value ? Number(e.target.value) : null,
                }))
              }
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>¿Qué buscas en MPD? (mínimo 1)</Label>
            <div className="grid grid-cols-1 gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => toggleGoal(g.value)}
                  className={cn(
                    "p-3 rounded-lg border text-sm text-left transition-colors",
                    data.goals.includes(g.value)
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (opcional)</Label>
            <Input
              id="nickname"
              type="text"
              placeholder="Tu alias de poker"
              value={data.nickname}
              onChange={(e) => setData((d) => ({ ...d, nickname: e.target.value }))}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={step === 1 || isPending}
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Atrás
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending}
          onClick={() => submitStep(step)}
        >
          {step === 3 ? "Finalizar" : "Siguiente"}
          {step < 3 && <ArrowRight className="ml-1 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
