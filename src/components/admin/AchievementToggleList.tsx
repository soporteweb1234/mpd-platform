"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, Check, X } from "lucide-react";
import { grantAchievement, revokeAchievement } from "@/lib/actions/admin-status";

type AchievementEntry = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointsAwarded: number;
  isSecret: boolean;
  unlocked: boolean;
};

export function AchievementToggleList({
  userId,
  achievements,
}: {
  userId: string;
  achievements: AchievementEntry[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = (a: AchievementEntry) => {
    startTransition(async () => {
      const res = a.unlocked
        ? await revokeAchievement(userId, a.id)
        : await grantAchievement(userId, a.id);
      if (res && "error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(a.unlocked ? "Logro revocado" : "Logro otorgado");
      router.refresh();
    });
  };

  if (achievements.length === 0) {
    return (
      <p className="text-sm text-mpd-gray py-6 text-center">
        No hay logros en el catálogo todavía.
      </p>
    );
  }

  const byCategory = achievements.reduce<Record<string, AchievementEntry[]>>((acc, a) => {
    (acc[a.category] = acc[a.category] ?? []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(byCategory).map(([category, list]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-mpd-gray font-medium">
            {category}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {list.map((a) => (
              <div
                key={a.id}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  a.unlocked
                    ? "border-mpd-gold/40 bg-mpd-gold/5"
                    : "border-mpd-border bg-mpd-surface"
                }`}
              >
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    a.unlocked ? "bg-mpd-gold/20" : "bg-mpd-black/30"
                  }`}
                >
                  <Award
                    className={`h-4 w-4 ${a.unlocked ? "text-mpd-gold" : "text-mpd-gray"}`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-mpd-white truncate">{a.name}</p>
                    {a.isSecret && (
                      <Badge variant="outline" className="text-[10px]">
                        Secreto
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      +{a.pointsAwarded}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-mpd-gray truncate">{a.description}</p>
                </div>
                <Button
                  size="sm"
                  variant={a.unlocked ? "ghost" : "outline"}
                  onClick={() => toggle(a)}
                  disabled={isPending}
                  className={a.unlocked ? "text-mpd-amber hover:text-mpd-amber" : ""}
                >
                  {a.unlocked ? (
                    <>
                      <X className="h-3.5 w-3.5 mr-1" /> Revocar
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" /> Otorgar
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
