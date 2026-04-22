import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CourseEditForm } from "@/components/admin/CourseEditForm";

export const metadata = { title: "Nuevo curso — Admin" };

export default async function AdminCourseNewPage() {
  const teachers = await prisma.user.findMany({
    where: { role: { in: ["TEACHER", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/cursos">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-mpd-white">Nuevo curso</h1>
          <p className="text-sm text-mpd-gray">
            Define precio, duración, cupo y docente. Las lecciones e inscripciones se
            gestionan tras crearlo.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos del curso</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEditForm
            mode="create"
            teachers={teachers.map((t) => ({
              id: t.id,
              name: t.name ?? t.email,
              email: t.email,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
