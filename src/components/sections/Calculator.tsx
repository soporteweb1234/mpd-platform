"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

const rooms = [
  { name: "PokerStars", baseRakeback: 25, mpdRakeback: 30 },
  { name: "GGPoker", baseRakeback: 30, mpdRakeback: 40 },
  { name: "888poker", baseRakeback: 20, mpdRakeback: 27 },
  { name: "WPT Global", baseRakeback: 35, mpdRakeback: 45 },
  { name: "iPoker", baseRakeback: 22, mpdRakeback: 28 },
];

const levels = [
  { name: "NL2 - NL10 (Micro)", monthlyRake: 150 },
  { name: "NL25 - NL50 (Low)", monthlyRake: 800 },
  { name: "NL100 - NL200 (Mid)", monthlyRake: 3000 },
  { name: "NL500+ (High)", monthlyRake: 10000 },
];

export function RakebackCalculator() {
  const [selectedRoom, setSelectedRoom] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [customRake, setCustomRake] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const room = rooms[selectedRoom];
  const level = levels[selectedLevel];
  const monthlyRake = customRake ?? level.monthlyRake;

  const withoutMpd = (monthlyRake * room.baseRakeback) / 100;
  const withMpd = (monthlyRake * room.mpdRakeback) / 100;
  const difference = withMpd - withoutMpd;
  const yearlyDiff = difference * 12;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Sala principal</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {rooms.map((r, i) => (
                <button
                  key={r.name}
                  onClick={() => { setSelectedRoom(i); setShowResult(false); }}
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
                  onClick={() => { setSelectedLevel(i); setCustomRake(null); setShowResult(false); }}
                  className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                    selectedLevel === i && customRake === null
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray hover:border-mpd-border-light"
                  }`}
                >
                  <div>{l.name}</div>
                  <div className="text-xs mt-0.5 text-mpd-gray-dark">~{formatCurrency(l.monthlyRake)}/mes rake</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customRake">Rake mensual personalizado (opcional)</Label>
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
            Calcular Rakeback
          </Button>
        </CardContent>
      </Card>

      {showResult && (
        <Card className="border-mpd-gold/30">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-mpd-white mb-4">Tu Rakeback Estimado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-mpd-black/50 border border-mpd-border">
                <p className="text-xs text-mpd-gray uppercase tracking-wider mb-1">Sin MPD ({room.baseRakeback}%)</p>
                <p className="text-2xl font-bold font-mono text-mpd-gray">{formatCurrency(withoutMpd)}<span className="text-sm text-mpd-gray-dark">/mes</span></p>
                <p className="text-xs text-mpd-gray-dark mt-1">{formatCurrency(withoutMpd * 12)}/año</p>
              </div>
              <div className="p-4 rounded-lg bg-mpd-gold/5 border border-mpd-gold/30">
                <p className="text-xs text-mpd-gold uppercase tracking-wider mb-1">Con MPD ({room.mpdRakeback}%)</p>
                <p className="text-2xl font-bold font-mono text-mpd-green">{formatCurrency(withMpd)}<span className="text-sm text-mpd-gray">/mes</span></p>
                <p className="text-xs text-mpd-gray mt-1">{formatCurrency(withMpd * 12)}/año</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-mpd-green/5 border border-mpd-green/20 text-center mb-6">
              <p className="text-xs text-mpd-gray mb-1">Ganarías de más con MPD</p>
              <p className="text-3xl font-bold font-mono text-mpd-green">{formatCurrency(difference)}<span className="text-sm text-mpd-gray">/mes</span></p>
              <p className="text-sm text-mpd-green mt-1">{formatCurrency(yearlyDiff)} extra al año</p>
            </div>
            <Button className="w-full" size="lg" asChild>
              <Link href="/register">
                Activa tu Rakeback Ahora <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
