import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { StatusManagePanel } from "@/components/admin/StatusManagePanel";
import { AchievementToggleList } from "@/components/admin/AchievementToggleList";

export const metadata = { title: "Gestionar status — Admin" };

export default async function AdminStatusDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const [user, catalog, unlocked] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        stratum: true,
        statusLevel: true,
        prestigeScore: true,
        reputationScore: true,
      },
    }),
    prisma.achievement.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
  ]);

  if (!user) notFound();

  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));
  const achievements = catalog.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    category: a.category,
    pointsAwarded: a.pointsAwarded,
    isSecret: a.isSecret,
    unlocked: unlockedIds.has(a.id),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/status">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-mpd-white">
            {user.name ?? user.email}
          </h1>
          <p className="text-sm text-mpd-gray">{user.email}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {user.stratum}
        </Badge>
      </div>

      <StatusManagePanel
        userId={user.id}
        statusLevel={user.statusLevel}
        prestigeScore={user.prestigeScore}
        reputationScore={user.reputationScore}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Logros ({unlocked.length}/{catalog.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementToggleList userId={user.id} achievements={achievements} />
        </CardContent>
      </Card>
    </div>
  );
}
