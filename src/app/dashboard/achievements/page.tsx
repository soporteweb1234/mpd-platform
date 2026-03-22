import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Trophy, Lock, HelpCircle } from "lucide-react";

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
    select: { points: true },
  });

  const categories = [...new Set(achievements.map((a) => a.category))];
  const categoryLabels: Record<string, string> = {
    RAKEBACK: "Rakeback",
    COMMUNITY: "Comunidad",
    LOYALTY: "Lealtad",
    SKILLS: "Habilidades",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-mpd-white">Logros</h1>
        <div className="flex items-center gap-2 text-mpd-gold">
          <Trophy className="h-5 w-5" />
          <span className="font-mono font-bold">{user?.points ?? 0} pts</span>
        </div>
      </div>

      <p className="text-sm text-mpd-gray">
        {unlockedIds.size} de {achievements.length} logros desbloqueados
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