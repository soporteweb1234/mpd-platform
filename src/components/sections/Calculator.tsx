"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatUSD } from "@/lib/utils";
import { MAIN_ROOMS, OTHER_ROOMS } from "@/lib/constants";
import { TrendingUp, ArrowRight, Gift, Shield, GraduationCap } from "lucide-react";
import Link from "next/link";

const levels = [
  { name: "NL2 - NL10 (Micro)", monthlyRake: 150 },
  { name: "NL25 - NL50 (Low)", monthlyRake: 800 },
  { name: "NL100 - NL200 (Mid)", monthlyRake: 3000 },
  { name: "NL500+ (High)", monthlyRake: 10000 },
];

type Tab = "main" | "other";

export function RakebackCalculator() {
  const [tab, setTab] = useState<Tab>("main");
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [customRake, setCustomRake] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const room = MAIN_ROOMS[selectedRoom];
  const level = levels[selectedLevel];
  const monthlyRake = customRake ?? level.monthlyRake;

  const withMpd = (monthlyRake * room.mpdRakeback) / 100;
  const monthlyBonus = withMpd;
  const yearlyBonus = withMpd * 12;

  return (
    <div className="space-y-6">
      {/* Tabs Principales / Otras salas */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-mpd-surface border border-mpd-border">
        <button
          type="button"
          onClick={() => {
            setTab("main");
            setShowResult(false);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "main"
              ? "bg-mpd-gold/15 text-mpd-gold"
              : "text-mpd-gray hover:text-mpd-white"
          }`}
        >
          Principales salas
        </button>
        <button
          type="button"
          onClick={() => {
            setTab("other");
            setShowResult(false);
          }}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "other"
              ? "bg-mpd-gold/15 text-mpd-gold"
              : "text-mpd-gray hover:text-mpd-white"
          }`}
        >
          Otras salas o club con servicio de agencia
        </button>
      </div>

      {tab === "main" ? (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Sala principal</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MAIN_ROOMS.map((r, i) => (
                  <button
                    key={r.slug}
                    onClick={() => {
                      setSelectedRoom(i);
                      setShowResult(false);
                    }}
                    className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                      selectedRoom === i
                        ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                        : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                    }`}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nivel de juego</Label>
              <div className="grid grid-cols-2 gap-2">
                {levels.map((l, i) => (
                  <button
                    key={l.name}
                    onClick={() => {
                      setSelectedLevel(i);
                      setCustomRake(null);
                      setShowResult(false);
                    }}
                    className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                      selectedLevel === i && customRake === null
                        ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                        : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                    }`}
                  >
                    <div>{l.name}</div>
                    <div className="text-xs mt-0.5 text-mpd-gray-dark">
                      ~{formatUSD(l.monthlyRake, { decimals: 0 })}/mes rake
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customRake">Rake mensual personalizado en USD (opcional)</Label>
              <Input
                id="customRake"
                type="number"
                placeholder="Ej: 500"
                value={customRake ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setCustomRake(v);
                  setShowResult(false);
                }}
              />
            </div>

            <Button className="w-full" size="lg" onClick={() => setShowResult(true)}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Calcular mis bonificaciones
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-display text-2xl text-mpd-white">
                Otras salas o clubes privados
              </h3>
              <p className="mt-2 text-sm text-mpd-gray">
                Operamos también como agencia para salas cerradas y clubes:{" "}
                {OTHER_ROOMS.map((r) => r.name).join(", ")} y más. Cada caso se estudia de
                forma individual porque las condiciones dependen de tu volumen, stake y
                temporalidad.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-mpd-gold/5 border border-mpd-gold/20 text-sm text-mpd-white">
              Analizamos tu perfil, stake, situación particular y temporalidad para
              recomendarte la opción con mejor relación calidad-precio para ti.
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" size="lg" asChild>
                <Link href="/contacto">
                  Solicitar análisis personalizado <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="flex-1" size="lg" asChild>
                <Link href="/register">Crear cuenta gratis</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "main" && showResult && (
        <Card className="border-mpd-gold/30">
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-display text-2xl text-mpd-white">Tus bonificaciones con MPD</h3>
              <p className="mt-1 text-sm text-mpd-gray">
                Rakeback en {room.name} al {room.mpdRakeback}% gestionado por Manager Poker Deals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-mpd-gold/5 border border-mpd-gold/30">
                <p className="text-xs text-mpd-gold uppercase tracking-wider mb-2">
                  Bonificación mensual
                </p>
                <p className="text-3xl font-mono font-bold text-mpd-gold">
                  {formatUSD(monthlyBonus)}
                </p>
                <p className="text-xs text-mpd-gray mt-1">Acumulada como saldo interno MPD</p>
              </div>
              <div className="p-5 rounded-xl bg-mpd-green/5 border border-mpd-green/20">
                <p className="text-xs text-mpd-green uppercase tracking-wider mb-2">
                  Bonificación anual
                </p>
                <p className="text-3xl font-mono font-bold text-mpd-green">
                  {formatUSD(yearlyBonus)}
                </p>
                <p className="text-xs text-mpd-gray mt-1">Rakeback estimado sobre 12 meses</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-mpd-white font-medium">Bonificaciones adicionales:</p>
              <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <li className="flex items-start gap-2 p-3 rounded-lg bg-mpd-surface border border-mpd-border">
                  <Gift className="h-4 w-4 text-mpd-gold mt-0.5 shrink-0" />
                  <span className="text-xs text-mpd-gray">
                    Servicios del ecosistema con saldo interno
                  </span>
                </li>
                <li className="flex items-start gap-2 p-3 rounded-lg bg-mpd-surface border border-mpd-border">
                  <Shield className="h-4 w-4 text-mpd-gold mt-0.5 shrink-0" />
                  <span className="text-xs text-mpd-gray">
                    Soporte prioritario y gestión de altas
                  </span>
                </li>
                <li className="flex items-start gap-2 p-3 rounded-lg bg-mpd-surface border border-mpd-border">
                  <GraduationCap className="h-4 w-4 text-mpd-gold mt-0.5 shrink-0" />
                  <span className="text-xs text-mpd-gray">
                    Acceso a coaching y comunidad MPD
                  </span>
                </li>
              </ul>
            </div>

            <Button className="w-full" size="lg" asChild>
              <Link href="/register">
                Activar mis bonificaciones <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
