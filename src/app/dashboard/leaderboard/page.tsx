import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { Medal, Trophy, Award } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata = { title: "Ranking" };

export default async function LeaderboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const entries = await prisma.leaderboardEntry.findMany({
    where: { period: currentPeriod, category: "RAKEBACK" },
    orderBy: { value: "desc" },
    take: 20,
  });

  const userIds = entries.map((e) => e.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, nickname: true, avatar: true, stratum: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const medalIcons = [
    <Trophy key="1" className="h-5 w-5 text-yellow-400" />,
    <Medal key="2" className="h-5 w-5 text-gray-300" />,
    <Award key="3" className="h-5 w-5 text-amber-600" />,
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-mpd-white">Ranking Mensual</h1>
      <p className="text-sm text-mpd-gray">Ranking de rakeback generado — {currentPeriod}</p>

      <Card>
        <CardContent className="p-4">
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const u = userMap[entry.userId];
                const isCurrentUser = entry.userId === session.user.id;
                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-lg",
                      isCurrentUser ? "bg-mpd-gold/10 border border-mpd-gold/20" : "hover:bg-mpd-surface-hover/50"
                    )}
                  >
                    <div className="w-8 text-center">
                      {index < 3 ? medalIcons[index] : (
                        <span className="text-sm font-mono text-mpd-gray">{index + 1}</span>
                      )}
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">{u ? getInitials(u.name) : "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-mpd-white truncate">
                        {u?.nickname ?? u?.name ?? "Jugador"}
                        {isCurrentUser && <span className="text-mpd-gold ml-1">(Tú)</span>}
                      </p>
                    </div>
                    <span className="text-sm font-mono font-medium text-mpd-green">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Sin datos de ranking" description="El ranking se actualiza con cada carga de rakeback." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}