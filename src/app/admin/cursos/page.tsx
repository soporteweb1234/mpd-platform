import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Plus, Users, CalendarDays } from "lucide-react";
import type { CourseStatus } from "@prisma/client";

export const metadata = { title: "Cursos — Admin" };

const STATUS_LABEL: Record<CourseStatus, string> = {
  DRAFT: "Borrador",
  OPEN_ENROLLMENT: "Abierto",
  IN_PROGRESS: "En curso",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
};

const STATUS_VARIANT: Record<
  CourseStatus,
  "default" | "secondary" | "success" | "warning" | "destructive"
> = {
  DRAFT: "secondary",
  OPEN_ENROLLMENT: "success",
  IN_PROGRESS: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
};

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    orderBy: [{ status: "asc" }, { startDate: "desc" }, { createdAt: "desc" }],
    include: { _count: { select: { enrollments: true, lessons: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Cursos</h1>
          <p className="text-sm text-mpd-gray">
            {courses.length} {courses.length === 1 ? "curso" : "cursos"} en catálogo
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/cursos/new">
            <Plus className="h-4 w-4 mr-1" /> Nuevo curso
          </Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <BookOpen className="h-10 w-10 mx-auto text-mpd-gray mb-3" />
            <p className="text-sm text-mpd-gray mb-4">
              Todavía no has creado ningún curso.
            </p>
            <Button asChild>
              <Link href="/admin/cursos/new">
                <Plus className="h-4 w-4 mr-1" /> Crear primer curso
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-mpd-border bg-mpd-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mpd-border bg-mpd-black/40">
                <th className="text-left py-2 px-3 text-mpd-gray font-medium">Curso</th>
                <th className="text-center py-2 px-3 text-mpd-gray font-medium">Estado</th>
                <th className="text-right py-2 px-3 text-mpd-gray font-medium">Precio</th>
                <th className="text-center py-2 px-3 text-mpd-gray font-medium">Plazas</th>
                <th className="text-center py-2 px-3 text-mpd-gray font-medium">Lecciones</th>
                <th className="text-center py-2 px-3 text-mpd-gray font-medium">Inicio</th>
                <th className="text-center py-2 px-3 text-mpd-gray font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-mpd-border/30">
                  <td className="py-2 px-3">
                    <p className="text-mpd-white font-medium">{c.title}</p>
                    <p className="text-[11px] text-mpd-gray font-mono">{c.slug}</p>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant={STATUS_VARIANT[c.status]} className="text-[10px]">
                      {STATUS_LABEL[c.status]}
                    </Badge>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-mpd-white">
                    {c.priceEur.toFixed(2)} €
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="inline-flex items-center gap-1 text-xs text-mpd-white">
                      <Users className="h-3 w-3 text-mpd-gray" />
                      <span className="font-mono">
                        {c._count.enrollments}/{c.maxStudents}
                      </span>
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-xs text-mpd-white font-mono">
                    {c._count.lessons}
                  </td>
                  <td className="py-2 px-3 text-center text-xs text-mpd-gray">
                    {c.startDate ? (
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(c.startDate).toLocaleDateString("es-ES")}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/cursos/${c.id}`}>Editar</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
