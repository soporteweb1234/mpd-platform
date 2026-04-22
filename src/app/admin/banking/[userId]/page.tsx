import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, FileText } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { BankingCandidateReview } from "@/components/admin/BankingCandidateReview";
import type { BankingCandidateStatus } from "@prisma/client";

export const metadata = { title: "Bancaje · detalle — Admin" };

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

export default async function AdminBankingDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  const candidate = await prisma.bankingCandidate.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          stratum: true,
          statusLevel: true,
        },
      },
    },
  });

  if (!candidate) notFound();

  const documents =
    candidate.documentsJson && typeof candidate.documentsJson === "object"
      ? (candidate.documentsJson as Record<string, unknown>)
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/banking">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-mpd-white truncate">
            {candidate.user.name ?? candidate.user.email}
          </h1>
          <p className="text-sm text-mpd-gray">{candidate.user.email}</p>
        </div>
        <Badge variant={STATUS_VARIANT[candidate.status]} className="ml-auto">
          {STATUS_LABEL[candidate.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Bankroll & trayectoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                    Bankroll mensual
                  </p>
                  <p className="text-mpd-white font-semibold">
                    {candidate.monthlyBankroll
                      ? `$${candidate.monthlyBankroll.toString()}`
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                    Estrato
                  </p>
                  <p className="text-mpd-white font-semibold">
                    {candidate.user.stratum ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                    Nivel status
                  </p>
                  <p className="text-mpd-white font-semibold">
                    {candidate.user.statusLevel ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-mpd-gray">
                    Creada
                  </p>
                  <p className="text-mpd-white font-semibold">
                    {formatDateTime(candidate.createdAt)}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-dashed border-mpd-border bg-mpd-black/30 p-6 flex flex-col items-center justify-center gap-2 text-center">
                <BarChart3 className="h-6 w-6 text-mpd-gray" />
                <p className="text-xs text-mpd-gray">
                  Gráfica de trayectoria —{" "}
                  {candidate.graphUrl ? (
                    <a
                      href={candidate.graphUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-mpd-gold underline"
                    >
                      ver en origen
                    </a>
                  ) : (
                    "placeholder (FASE 4.C)"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-mpd-gray" /> Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!documents && (
                <p className="text-xs text-mpd-gray">
                  No se han aportado documentos.
                </p>
              )}
              {documents && (
                <pre className="text-[11px] text-mpd-gray bg-mpd-black/40 p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(documents, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Decisión</CardTitle>
          </CardHeader>
          <CardContent>
            <BankingCandidateReview
              candidateId={candidate.id}
              currentStatus={candidate.status}
              currentNotes={candidate.notes}
            />
            {candidate.reviewedAt && (
              <p className="text-[11px] text-mpd-gray mt-3">
                Última revisión: {formatDateTime(candidate.reviewedAt)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
