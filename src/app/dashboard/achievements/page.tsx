import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Trophy, Lock, HelpCircle, Shield, Star, Award, TrendingUp } from "lucide-react";

export const metadata = { title: "Logros" };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const achievements = await prisma.achievement.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId: session.user.id },
    select: { achievementId: true, unlockedAt: true },
  });

  const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { points: true, level: true, stratum: true },
  });

  const categories = [...new Set(achievements.map((a) => a.category))];
  const categoryLabels: Record<string, string> = {
    RAKEBACK: "Rakeback",
    COMMUNITY: "Comunidad",
    LOYALTY: "Lealtad",
    SKILLS: "Habilidades",
  };

  // Gamification calculations
  const points = user?.points ?? 0;
  const level = user?.level ?? 1;
  const totalAchievements = achievements.length;
  const unlockedCount = unlockedIds.size;
  const prestigeIndex = Math.min(Math.round((points / 100) + (unlockedCount * 5) + (level * 10)), 999);

  const getReputationLevel = (index: number) => {
    if (index >= 500) return { label: "Leyenda", color: "text-mpd-gold", bg: "bg-mpd-gold/20" };
    if (index >= 300) return { label: "Veterano", color: "text-mpd-green", bg: "bg-mpd-green/20" };
    if (index >= 150) return { label: "Establecido", color: "text-mpd-amber", bg: "bg-mpd-amber/20" };
    if (index >= 50) return { label: "Activo", color: "text-mpd-white", bg: "bg-mpd-surface" };
    return { label: "Novato", color: "text-mpd-gray", bg: "bg-mpd-surface" };
  };

  const reputation = getReputationLevel(prestigeIndex);

  // Galones based on level
  const getGalon = (lvl: number) => {
    if (lvl >= 20) return { rank: "Diamante", icon: "💎", stripes: 5 };
    if (lvl >= 15) return { rank: "Platino", icon: "⭐", stripes: 4 };
    if (lvl >= 10) return { rank: "Oro", icon: "🥇", stripes: 3 };
    if (lvl >= 5) return { rank: "Plata", icon: "🥈", stripes: 2 };
    return { rank: "Bronce", icon: "🥉", stripes: 1 };
  };

  const galon = getGalon(level);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Logros y Reputación</h1>
        <div className="flex items-center gap-2 text-mpd-gold">
          <Trophy className="h-5 w-5" />
          <span className="font-mono font-bold">{points} pts</span>
        </div>
      </div>

      {/* Gamification Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Galón / Rango */}
        <Card className="border-mpd-gold/20">
          <CardContent className="p-5 text-center">
            <div className="text-3xl mb-2">{galon.icon}</div>
            <h3 className="text-sm font-medium text-mpd-white">Galón</h3>
            <p className="text-lg font-bold text-mpd-gold">{galon.rank}</p>
            <div className="flex justify-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 w-4 rounded-full",
                    i < galon.stripes ? "bg-mpd-gold" : "bg-mpd-border"
                  )}
                />
              ))}
            </div>
            <p className="text-[10px] text-mpd-gray-dark mt-2">Nivel {level}</p>
          </CardContent>
        </Card>

        {/* Logros */}
        <Card>
          <CardContent className="p-5 text-center">
            <Award className="h-8 w-8 mx-auto text-mpd-gold mb-2" />
            <h3 className="text-sm font-medium text-mpd-white">Logros</h3>
            <p className="text-lg font-bold text-mpd-white">{unlockedCount}<span className="text-mpd-gray text-sm font-normal">/{totalAchievements}</span></p>
            <p className="text-[10px] text-mpd-gray-dark mt-1">Hitos desbloqueados</p>
          </CardContent>
        </Card>

        {/* Índice de Prestigio */}
        <Card>
          <CardContent className="p-5 text-center">
            <Star className="h-8 w-8 mx-auto text-mpd-gold mb-2" />
            <h3 className="text-sm font-medium text-mpd-white">Índice de Prestigio</h3>
            <p className="text-lg font-bold font-mono text-mpd-gold">{prestigeIndex}</p>
            <p className="text-[10px] text-mpd-gray-dark mt-1">Puntuación de reputación</p>
          </CardContent>
        </Card>

        {/* Nivel de Reputación */}
        <Card className={cn("border", reputation.color === "text-mpd-gold" ? "border-mpd-gold/30" : "border-mpd-border")}>
          <CardContent className="p-5 text-center">
            <Shield className="h-8 w-8 mx-auto text-mpd-gold mb-2" />
            <h3 className="text-sm font-medium text-mpd-white">Reputación</h3>
            <Badge className={cn("mt-1", reputation.bg, reputation.color)}>
              {reputation.label}
            </Badge>
            <p className="text-[10px] text-mpd-gray-dark mt-2">Badge visible en tu perfil</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-mpd-gray">
        {unlockedCount} de {totalAchievements} logros desbloqueados
      </p>

      {categories.map((cat) => (
        <div key={cat}>
          <h2 className="text-lg font-semibold text-mpd-white mb-3">{categoryLabels[cat] ?? cat}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {achievements
              .filter((a) => a.category === cat)
              .map((achievement) => {
                const unlocked = unlockedIds.has(achievement.id);
                const isSecret = achievement.isSecret && !unlocked;

                return (
                  <Card
                    key={achievement.id}
                    className={cn(
                      "transition-all",
                      unlocked
                        ? "border-mpd-gold/30 bg-mpd-gold/5"
                        : "opacity-50"
                    )}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">
                        {isSecret ? <HelpCircle className="h-8 w-8 mx-auto text-mpd-gray-dark" /> : achievement.icon}
                      </div>
                      <h3 className="text-sm font-medium text-mpd-white mb-0.5">
                        {isSecret ? "???" : achievement.name}
                      </h3>
                      <p className="text-[10px] text-mpd-gray">
                        {isSecret ? "Logro secreto" : achievement.description}
                      </p>
                      {unlocked && (
                        <p className="text-[10px] text-mpd-gold mt-1">+{achievement.pointsAwarded} pts</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}