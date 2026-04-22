import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  GraduationCap,
  Users,
  Clock,
  Play,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Cursos" };

const statusLabels: Record<string, { label: string; variant: "success" | "warning" | "secondary" }> = {
  OPEN_ENROLLMENT: { label: "Inscripciones abiertas", variant: "success" },
  IN_PROGRESS: { label: "En curso", variant: "secondary" },
  COMPLETED: { label: "Finalizado", variant: "secondary" },
  CANCELLED: { label: "Cancelado", variant: "secondary" },
  DRAFT: { label: "Próximamente", variant: "warning" },
};

// Fallback gradientes por índice (para cursos sin coverImageUrl)
const gradients = [
  "from-mpd-gold/40 via-mpd-amber/20 to-mpd-black",
  "from-mpd-green/40 via-emerald-500/10 to-mpd-black",
  "from-blue-500/40 via-cyan-500/10 to-mpd-black",
  "from-purple-500/40 via-fuchsia-500/10 to-mpd-black",
  "from-rose-500/40 via-orange-500/10 to-mpd-black",
];

export default async function CursosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const courses = await prisma.course.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { lessons: true, enrollments: true } },
    },
  });

  const activeEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      userId: session.user.id,
      status: { in: ["TRIAL", "ENROLLED"] },
    },
    include: { course: { select: { title: true, slug: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Cursos</h1>
        <p className="mt-1 text-sm text-mpd-gray max-w-2xl">
          Grupos cerrados de estudio con análisis de manos, teoría avanzada y
          retroalimentación personalizada. Máximo 12 alumnos por cohorte.
        </p>
      </div>

      {/* Mis cursos activos */}
      {activeEnrollments.length > 0 && (
        <Card className="border-mpd-green/20 bg-mpd-green/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-mpd-green" />
              <span className="text-sm font-medium text-mpd-white">
                Tus cursos activos
              </span>
            </div>
            <ul className="space-y-2">
              {activeEnrollments.map((en) => (
                <li
                  key={en.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-mpd-white">{en.course.title}</span>
                  <Badge variant="success">
                    {en.status === "TRIAL" ? "Trial" : "Activo"}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Grid de cursos */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course, idx) => {
            const statusCfg =
              statusLabels[course.status] ?? { label: course.status, variant: "secondary" as const };
            const isAvailable = course.status === "OPEN_ENROLLMENT";
            const gradient = gradients[idx % gradients.length];

            return (
              <Card
                key={course.id}
                className="overflow-hidden flex flex-col group hover:border-mpd-gold/40 transition-colors"
              >
                {/* Miniatura / cover */}
                <div
                  className={`relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br ${gradient}`}
                >
                  {course.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.coverImageUrl}
                      alt={course.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <GraduationCap className="h-14 w-14 text-mpd-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-mpd-black/80 via-mpd-black/20 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  </div>
                  {course._count.lessons > 0 && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-mpd-black/70 px-2 py-1 text-[10px] text-mpd-white backdrop-blur-sm">
                      <Play className="h-3 w-3" />
                      {course._count.lessons} lecciones
                    </div>
                  )}
                </div>

                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="text-base font-semibold text-mpd-white line-clamp-1">
                    {course.title}
                  </h3>
                  {course.tagline && (
                    <p className="text-[11px] text-mpd-gold mt-0.5 uppercase tracking-wider">
                      {course.tagline}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-mpd-gray leading-relaxed line-clamp-3 flex-1">
                    {course.description}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 pb-3 border-b border-mpd-border/50">
                    <div className="text-center">
                      <Users className="h-3.5 w-3.5 text-mpd-gold mx-auto mb-0.5" />
                      <p className="text-[10px] text-mpd-gray-dark">Grupo</p>
                      <p className="text-[11px] font-medium text-mpd-white">
                        Máx. {course.maxStudents}
                      </p>
                    </div>
                    <div className="text-center">
                      <Clock className="h-3.5 w-3.5 text-mpd-gold mx-auto mb-0.5" />
                      <p className="text-[10px] text-mpd-gray-dark">Duración</p>
                      <p className="text-[11px] font-medium text-mpd-white">
                        {course.durationWeeks} sem.
                      </p>
                    </div>
                    <div className="text-center">
                      <Sparkles className="h-3.5 w-3.5 text-mpd-gold mx-auto mb-0.5" />
                      <p className="text-[10px] text-mpd-gray-dark">Trial</p>
                      <p className="text-[11px] font-medium text-mpd-white">
                        {course.trialWeeks} sem.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    {isAvailable ? (
                      <Button size="sm" asChild>
                        <Link
                          href={`/dashboard/support/new?subject=${encodeURIComponent(
                            `Interés en curso: ${course.title}`,
                          )}&category=OTHER&message=${encodeURIComponent(
                            `Hola, me interesa apuntarme al curso "${course.title}". ¿Podéis facilitarme información sobre disponibilidad y condiciones?`,
                          )}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                          Me interesa
                        </Link>
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled>
                        Próxima convocatoria
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10">
            <EmptyState
              title="Próximamente"
              description="Pronto abriremos la próxima convocatoria de cursos. Te avisaremos por notificación cuando esté disponible."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
