import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AchievementCatalogEditor } from "@/components/admin/AchievementCatalogEditor";

export const metadata = { title: "Catálogo de logros — Admin" };

export default async function AdminAchievementsCatalogPage() {
  const achievements = await prisma.achievement.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/status">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Catálogo de logros</h1>
          <p className="text-sm text-mpd-gray">
            Define los logros desbloqueables. El otorgamiento se hace desde el detalle de
            cada usuario.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logros disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementCatalogEditor
            achievements={achievements.map((a) => ({
              id: a.id,
              slug: a.slug,
              name: a.name,
              description: a.description,
              icon: a.icon,
              category: a.category,
              pointsAwarded: a.pointsAwarded,
              requiredValue: a.requiredValue,
              isSecret: a.isSecret,
              sortOrder: a.sortOrder,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
