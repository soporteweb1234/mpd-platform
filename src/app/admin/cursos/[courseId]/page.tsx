import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, BookOpen } from "lucide-react";
import { CourseEditForm } from "@/components/admin/CourseEditForm";
import { CourseLessonList } from "@/components/admin/CourseLessonList";
import { CourseEnrollmentsTable } from "@/components/admin/CourseEnrollmentsTable";

export const metadata = { title: "Editar curso — Admin" };

export default async function AdminCourseEditPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: { select: { enrollments: true, lessons: true } },
      lessons: { orderBy: { lessonNumber: "asc" } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!course) notFound();

  const enrolledUserIds = new Set(course.enrollments.map((e) => e.userId));

  const [teachers, candidateUsers] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["TEACHER", "ADMIN", "SUPER_ADMIN"] } },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
  ]);

  const availableUsers = candidateUsers
    .filter((u) => !enrolledUserIds.has(u.id))
    .map((u) => ({ id: u.id, name: u.name ?? u.email, email: u.email }));

  const seatsLeft = Math.max(0, course.maxStudents - course._count.enrollments);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/cursos">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-mpd-white">{course.title}</h1>
          <p className="text-sm text-mpd-gray">
            <span className="font-mono">{course.slug}</span> ·{" "}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {course._count.enrollments}/{course.maxStudents}
            </span>{" "}
            ·{" "}
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {course._count.lessons} lecciones
            </span>
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {course.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración del curso</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEditForm
            mode="edit"
            teachers={teachers.map((t) => ({
              id: t.id,
              name: t.name ?? t.email,
              email: t.email,
            }))}
            course={{
              id: course.id,
              enrollmentsCount: course._count.enrollments,
              title: course.title,
              slug: course.slug,
              description: course.description,
              teacherId: course.teacherId,
              coverImageUrl: course.coverImageUrl,
              tagline: course.tagline,
              priceEur: course.priceEur,
              priceWithAffiliation: course.priceWithAffiliation,
              maxStudents: course.maxStudents,
              durationWeeks: course.durationWeeks,
              trialWeeks: course.trialWeeks,
              startDate: course.startDate ? course.startDate.toISOString() : null,
              endDate: course.endDate ? course.endDate.toISOString() : null,
              schedule: course.schedule,
              status: course.status,
              requiredStratum: course.requiredStratum,
              requiresAffiliation: course.requiresAffiliation,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lecciones</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseLessonList
            courseId={course.id}
            lessons={course.lessons.map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description,
              lessonNumber: l.lessonNumber,
              scheduledAt: l.scheduledAt ? l.scheduledAt.toISOString() : null,
              recordingUrl: l.recordingUrl,
              materials: l.materials,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inscripciones</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseEnrollmentsTable
            courseId={course.id}
            seatsLeft={seatsLeft}
            availableUsers={availableUsers}
            enrollments={course.enrollments.map((e) => ({
              id: e.id,
              status: e.status,
              paidAmount: e.paidAmount,
              paidWithBalance: e.paidWithBalance,
              enrolledAt: e.enrolledAt.toISOString(),
              user: {
                id: e.user.id,
                name: e.user.name ?? e.user.email,
                email: e.user.email,
              },
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
