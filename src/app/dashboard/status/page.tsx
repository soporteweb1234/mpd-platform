import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getStatusGalon, getStatusLevelLabel } from "@/lib/utils";
import { Shield, Trophy, Sparkles, HeartHandshake, Lock } from "lucide-react";

export const metadata = { title: "Status | MPD" };

export default async function StatusPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      statusLevel: true,
      prestigeScore: true,
      reputationScore: true,
    },
  });
  if (!user) redirect("/login");

  const galon = getStatusGalon(user.statusLevel);
  const achievementsUnlocked = 0;
  const achievementsTotal = 15;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-mpd-white">Status</h1>
        <p className="mt-1 text-sm text-mpd-gray">
          Tu nivel global, prestigio y reputación dentro de Manager Poker Deals.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Galón */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-mpd-gray">
              <Shield className={cn("h-4 w-4", galon.color)} />
              Galón
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className={cn("text-2xl font-display font-semibold", galon.color)}>
              {galon.tier}
            </p>
            <p className="text-xs text-mpd-gray">
              Nivel {galon.nivel} — {getStatusLevelLabel(user.statusLevel)}
            </p>
          </CardContent>
        </Card>

        {/* Logros */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-mpd-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <Lock className="h-6 w-6 text-mpd-gray" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-mpd-gray">
              <Trophy className="h-4 w-4 text-mpd-gold" />
              Logros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold text-mpd-white">
              {achievementsUnlocked}/{achievementsTotal}
            </p>
            <p className="text-xs text-mpd-gray mt-1">Próximamente</p>
          </CardContent>
        </Card>

        {/* Prestigio */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-mpd-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <Lock className="h-6 w-6 text-mpd-gray" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-mpd-gray">
              <Sparkles className="h-4 w-4 text-mpd-gold" />
              Prestigio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold text-mpd-white">
              {user.prestigeScore}/100
            </p>
            <p className="text-xs text-mpd-gray mt-1">Próximamente</p>
          </CardContent>
        </Card>

        {/* Reputación */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-mpd-gray">
              <HeartHandshake className="h-4 w-4 text-mpd-green" />
              Reputación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-mono font-semibold text-mpd-green">
              {user.reputationScore}
            </p>
            <p className="text-xs text-mpd-gray mt-1">Puntos acumulados</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-display text-xl text-mpd-white">Progresión del Galón</h2>
          <p className="mt-2 text-sm text-mpd-gray">
            Tu Galón evoluciona con volumen, antigüedad y aportación a la comunidad. Cada nivel
            desbloquea condiciones preferentes, acceso a salas cerradas y servicios del
            ecosistema con descuento.
          </p>
          <div className="mt-4 grid grid-cols-5 gap-2 text-center">
            {(["APRENDIZ", "VERSADO", "PROFESIONAL", "EXPERTO", "MAESTRO"] as const).map((lv) => {
              const g = getStatusGalon(lv);
              const active = lv === user.statusLevel;
              return (
                <div
                  key={lv}
                  className={cn(
                    "rounded-lg border p-3 text-xs",
                    active
                      ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                      : "border-mpd-border bg-mpd-surface text-mpd-gray"
                  )}
                >
                  <div className="font-semibold">{g.tier}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider">
                    {getStatusLevelLabel(lv)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
