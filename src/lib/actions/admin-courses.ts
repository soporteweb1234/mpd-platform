"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import type {
  CourseStatus,
  EnrollmentStatus,
  PlayerStratum,
} from "@prisma/client";

// ============================================
// Inputs
// ============================================

export type CourseInput = {
  title: string;
  slug: string;
  description: string;
  teacherId?: string | null;
  coverImageUrl?: string | null;
  tagline?: string | null;
  priceEur: number;
  priceWithAffiliation?: number | null;
  maxStudents: number;
  durationWeeks: number;
  trialWeeks: number;
  startDate?: string | null;
  endDate?: string | null;
  schedule?: string | null;
  status: CourseStatus;
  requiredStratum?: PlayerStratum | null;
  requiresAffiliation: boolean;
};

export type LessonInput = {
  title: string;
  description?: string | null;
  lessonNumber: number;
  scheduledAt?: string | null;
  recordingUrl?: string | null;
  materials?: string[];
};

function parseDate(d?: string | null): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateCourse(input: CourseInput): string | null {
  if (!input.title?.trim()) return "Título requerido";
  if (!input.slug?.trim()) return "Slug requerido";
  if (!input.description?.trim()) return "Descripción requerida";
  if (input.priceEur < 0) return "Precio inválido";
  if (input.priceWithAffiliation != null && input.priceWithAffiliation < 0) {
    return "Precio con afiliación inválido";
  }
  if (input.maxStudents < 1 || input.maxStudents > 200) {
    return "maxStudents fuera de rango (1–200)";
  }
  if (input.durationWeeks < 1 || input.durationWeeks > 104) {
    return "durationWeeks fuera de rango (1–104)";
  }
  if (input.trialWeeks < 0 || input.trialWeeks > input.durationWeeks) {
    return "trialWeeks inválido";
  }
  return null;
}

function revalidateCourses(courseId?: string) {
  revalidatePath("/admin/cursos");
  if (courseId) revalidatePath(`/admin/cursos/${courseId}`);
  revalidatePath("/dashboard/cursos");
}

// ============================================
// Courses
// ============================================

export async function createCourse(input: CourseInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const err = validateCourse(input);
  if (err) return { error: err };

  const slugExists = await prisma.course.findUnique({
    where: { slug: input.slug.trim() },
    select: { id: true },
  });
  if (slugExists) return { error: "Slug ya existe" };

  const created = await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title: input.title.trim(),
        slug: input.slug.trim(),
        description: input.description.trim(),
        teacherId: input.teacherId || null,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        tagline: input.tagline?.trim() || null,
        priceEur: input.priceEur,
        priceWithAffiliation: input.priceWithAffiliation ?? null,
        maxStudents: input.maxStudents,
        durationWeeks: input.durationWeeks,
        trialWeeks: input.trialWeeks,
        startDate: parseDate(input.startDate),
        endDate: parseDate(input.endDate),
        schedule: input.schedule?.trim() || null,
        status: input.status,
        requiredStratum: input.requiredStratum ?? null,
        requiresAffiliation: input.requiresAffiliation,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "COURSE_CREATED",
        entityType: "course",
        entityId: course.id,
        details: { title: course.title, slug: course.slug, status: course.status },
      },
    });
    return course;
  });

  revalidateCourses(created.id);
  return { success: true, id: created.id };
}

export async function updateCourse(courseId: string, input: CourseInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!courseId) return { error: "Curso inválido" };
  const err = validateCourse(input);
  if (err) return { error: err };

  const before = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, status: true, priceEur: true },
  });
  if (!before) return { error: "Curso no encontrado" };

  if (input.slug.trim() !== before.slug) {
    const conflict = await prisma.course.findUnique({
      where: { slug: input.slug.trim() },
      select: { id: true },
    });
    if (conflict && conflict.id !== courseId) return { error: "Slug ya existe" };
  }

  await prisma.$transaction([
    prisma.course.update({
      where: { id: courseId },
      data: {
        title: input.title.trim(),
        slug: input.slug.trim(),
        description: input.description.trim(),
        teacherId: input.teacherId || null,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        tagline: input.tagline?.trim() || null,
        priceEur: input.priceEur,
        priceWithAffiliation: input.priceWithAffiliation ?? null,
        maxStudents: input.maxStudents,
        durationWeeks: input.durationWeeks,
        trialWeeks: input.trialWeeks,
        startDate: parseDate(input.startDate),
        endDate: parseDate(input.endDate),
        schedule: input.schedule?.trim() || null,
        status: input.status,
        requiredStratum: input.requiredStratum ?? null,
        requiresAffiliation: input.requiresAffiliation,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "COURSE_UPDATED",
        entityType: "course",
        entityId: courseId,
        details: {
          statusBefore: before.status,
          statusAfter: input.status,
          priceBefore: before.priceEur,
          priceAfter: input.priceEur,
        },
      },
    }),
  ]);

  revalidateCourses(courseId);
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, _count: { select: { enrollments: true } } },
  });
  if (!course) return { error: "Curso no encontrado" };

  const hasEnrollments = course._count.enrollments > 0;

  await prisma.$transaction(async (tx) => {
    if (hasEnrollments) {
      await tx.course.update({
        where: { id: courseId },
        data: { status: "CANCELLED" },
      });
    } else {
      await tx.course.delete({ where: { id: courseId } });
    }
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: hasEnrollments ? "COURSE_CANCELLED" : "COURSE_DELETED",
        entityType: "course",
        entityId: courseId,
        details: { title: course.title, enrollments: course._count.enrollments },
      },
    });
  });

  revalidateCourses();
  return { success: true, soft: hasEnrollments };
}

// ============================================
// Lessons
// ============================================

function validateLesson(input: LessonInput): string | null {
  if (!input.title?.trim()) return "Título de lección requerido";
  if (!Number.isInteger(input.lessonNumber) || input.lessonNumber < 1) {
    return "Número de lección inválido";
  }
  return null;
}

export async function createLesson(courseId: string, input: LessonInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!courseId) return { error: "Curso inválido" };
  const err = validateLesson(input);
  if (err) return { error: err };

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  if (!course) return { error: "Curso no encontrado" };

  const created = await prisma.$transaction(async (tx) => {
    const lesson = await tx.courseLesson.create({
      data: {
        courseId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        lessonNumber: input.lessonNumber,
        scheduledAt: parseDate(input.scheduledAt),
        recordingUrl: input.recordingUrl?.trim() || null,
        materials: input.materials ?? [],
      },
    });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "LESSON_CREATED",
        entityType: "courseLesson",
        entityId: lesson.id,
        details: { courseId, title: lesson.title, lessonNumber: lesson.lessonNumber },
      },
    });
    return lesson;
  });

  revalidateCourses(courseId);
  return { success: true, id: created.id };
}

export async function updateLesson(lessonId: string, input: LessonInput) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const before = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true },
  });
  if (!before) return { error: "Lección no encontrada" };

  const err = validateLesson(input);
  if (err) return { error: err };

  await prisma.$transaction([
    prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        lessonNumber: input.lessonNumber,
        scheduledAt: parseDate(input.scheduledAt),
        recordingUrl: input.recordingUrl?.trim() || null,
        materials: input.materials ?? [],
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "LESSON_UPDATED",
        entityType: "courseLesson",
        entityId: lessonId,
        details: { courseId: before.courseId, lessonNumber: input.lessonNumber },
      },
    }),
  ]);

  revalidateCourses(before.courseId);
  return { success: true };
}

export async function deleteLesson(lessonId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const lesson = await prisma.courseLesson.findUnique({
    where: { id: lessonId },
    select: { id: true, courseId: true, title: true },
  });
  if (!lesson) return { error: "Lección no encontrada" };

  await prisma.$transaction(async (tx) => {
    await tx.courseLesson.delete({ where: { id: lessonId } });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "LESSON_DELETED",
        entityType: "courseLesson",
        entityId: lessonId,
        details: { courseId: lesson.courseId, title: lesson.title },
      },
    });
  });

  revalidateCourses(lesson.courseId);
  return { success: true };
}

// ============================================
// Enrollments
// ============================================

export async function enrollUser(
  courseId: string,
  userId: string,
  paidAmount: number,
  paidWithBalance: boolean,
) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  if (!courseId || !userId) return { error: "Curso o usuario inválido" };
  if (paidAmount < 0) return { error: "Importe inválido" };

  const [course, user, existing] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, maxStudents: true, _count: { select: { enrollments: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
      select: { id: true },
    }),
  ]);
  if (!course) return { error: "Curso no encontrado" };
  if (!user) return { error: "Usuario no encontrado" };
  if (existing) return { error: "El usuario ya está inscrito" };
  if (course._count.enrollments >= course.maxStudents) {
    return { error: "Curso lleno (maxStudents)" };
  }

  const created = await prisma.$transaction(async (tx) => {
    const enrollment = await tx.courseEnrollment.create({
      data: {
        userId,
        courseId,
        status: "ENROLLED",
        paidAmount,
        paidWithBalance,
      },
    });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ENROLLMENT_CREATED",
        entityType: "courseEnrollment",
        entityId: enrollment.id,
        details: { courseId, targetUserId: userId, paidAmount, paidWithBalance },
      },
    });
    return enrollment;
  });

  revalidateCourses(courseId);
  return { success: true, id: created.id };
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: EnrollmentStatus,
) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const before = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true, status: true },
  });
  if (!before) return { error: "Inscripción no encontrada" };

  await prisma.$transaction([
    prisma.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ENROLLMENT_STATUS_UPDATED",
        entityType: "courseEnrollment",
        entityId: enrollmentId,
        details: {
          courseId: before.courseId,
          statusBefore: before.status,
          statusAfter: status,
        },
      },
    }),
  ]);

  revalidateCourses(before.courseId);
  return { success: true };
}

export async function cancelEnrollment(enrollmentId: string) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const before = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: { id: true, courseId: true, userId: true },
  });
  if (!before) return { error: "Inscripción no encontrada" };

  await prisma.$transaction(async (tx) => {
    await tx.courseEnrollment.delete({ where: { id: enrollmentId } });
    await tx.activityLog.create({
      data: {
        userId: session.user.id,
        action: "ENROLLMENT_CANCELLED",
        entityType: "courseEnrollment",
        entityId: enrollmentId,
        details: { courseId: before.courseId, targetUserId: before.userId },
      },
    });
  });

  revalidateCourses(before.courseId);
  return { success: true };
}
