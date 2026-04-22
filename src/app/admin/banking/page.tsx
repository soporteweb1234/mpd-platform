import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Landmark, Wrench } from "lucide-react";
import type { BankingCandidateStatus } from "@prisma/client";

export const metadata = { title: "Bancaje — Admin" };

const STATUS_LABEL: Record<BankingCandidateStatus, string> = {
  PENDING: "Pendiente",
  REVIEWING: "En revisión",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

const STATUS_VARIANT: Record<
  BankingCandidateStatus,
  "default" | "secondary" | "success" | "destructive" | "warning"
> = {
  PENDING: "warning",
  REVIEWING: "default",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default async function AdminBankingPage() {
  const candidates = await prisma.bankingCandidate.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      user: {
        select: { id: true, name: true, email: true, stratum: true },
      },
    },
    take: 200,
  });

  const counts = candidates.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<BankingCandidateStatus, number>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-mpd-gold/10 flex items-center justify-center">
          <Landmark className="h-5 w-5 text-mpd-gold" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Bancaje</h1>
          <p className="text-sm text-mpd-gray">
            Revisión de candidaturas a bancaje parcial 50/50 bankroll.
          </p>
        </div>
      </div>

      <Card className="border-mpd-amber/40 bg-mpd-amber/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Wrench className="h-4 w-4 text-mpd-amber mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-mpd-white font-medium">
              Sección en construcción (solo admin)
            </p>
            <p className="text-xs text-mpd-gray mt-1">
              Las candidaturas user-side se habilitan en FASE 4.C. Por ahora este panel
              permite revisar entradas creadas manualmente o vía import.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(STATUS_LABEL) as BankingCandidateStatus[]).map((s) => (
          <Card key={s}>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                {STATUS_LABEL[s]}
              </p>
              <p className="text-2xl font-bold text-mpd-white mt-1">
                {counts[s] ?? 0}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Candidaturas</CardTitle>
        </CardHeader>
        <CardContent>
          {candidates.length === 0 && (
            <p className="text-sm text-mpd-gray">
              Sin candidaturas registradas todavía.
            </p>
          )}
          <div className="space-y-2">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-mpd-border/50 bg-mpd-black/30 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-mpd-white truncate">
                    {c.user.name ?? c.user.email}
                  </p>
                  <p className="text-xs text-mpd-gray truncate">
                    {c.user.email} · {c.user.stratum ?? "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[c.status]} className="text-[10px]">
                    {STATUS_LABEL[c.status]}
                  </Badge>
                  <span className="text-xs text-mpd-gray hidden md:inline">
                    {formatDate(c.createdAt)}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/banking/${c.userId}`}>Revisar</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
