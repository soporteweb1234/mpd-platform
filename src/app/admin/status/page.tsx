import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";
import type { StatusLevel, PlayerStratum } from "@prisma/client";

export const metadata = { title: "Status & Logros — Admin" };

const LEVEL_LABEL: Record<StatusLevel, string> = {
  APRENDIZ: "Aprendiz",
  VERSADO: "Versado",
  PROFESIONAL: "Profesional",
  EXPERTO: "Experto",
  MAESTRO: "Maestro",
};

const LEVEL_VARIANT: Record<
  StatusLevel,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  APRENDIZ: "secondary",
  VERSADO: "default",
  PROFESIONAL: "default",
  EXPERTO: "warning",
  MAESTRO: "success",
};

const STRATUM_LABEL: Record<PlayerStratum, string> = {
  NOVATO: "Novato",
  SEMI_PRO: "Semi-pro",
  PROFESIONAL: "Profesional",
  REFERENTE: "Referente",
};

export default async function AdminStatusPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      stratum: true,
      statusLevel: true,
      prestigeScore: true,
      reputationScore: true,
      _count: { select: { achievements: true } },
    },
    orderBy: [{ prestigeScore: "desc" }, { name: "asc" }],
    take: 500,
  });

  const achievementsCount = await prisma.achievement.count();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Status & Logros</h1>
          <p className="text-sm text-mpd-gray">
            {users.length} usuarios · {achievementsCount} logros en catálogo
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/status/catalog">
            <Award className="h-4 w-4 mr-1" /> Catálogo de logros
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mpd-border bg-mpd-black/40">
                  <th className="text-left py-2 px-3 text-mpd-gray font-medium">
                    Usuario
                  </th>
                  <th className="text-center py-2 px-3 text-mpd-gray font-medium">
                    Estrato
                  </th>
                  <th className="text-center py-2 px-3 text-mpd-gray font-medium">
                    Nivel
                  </th>
                  <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                    Prestigio
                  </th>
                  <th className="text-right py-2 px-3 text-mpd-gray font-medium">
                    Reputación
                  </th>
                  <th className="text-center py-2 px-3 text-mpd-gray font-medium">
                    Logros
                  </th>
                  <th className="text-center py-2 px-3 text-mpd-gray font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-mpd-border/30">
                    <td className="py-2 px-3">
                      <p className="text-mpd-white">{u.name ?? u.email}</p>
                      <p className="text-[11px] text-mpd-gray">{u.email}</p>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Badge variant="secondary" className="text-[10px]">
                        {STRATUM_LABEL[u.stratum]}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Badge
                        variant={LEVEL_VARIANT[u.statusLevel]}
                        className="text-[10px]"
                      >
                        {LEVEL_LABEL[u.statusLevel]}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-mpd-white">
                      {u.prestigeScore}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-mpd-white">
                      {u.reputationScore}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-mpd-white">
                      {u._count.achievements}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/status/${u.id}`}>Gestionar</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
