"use server";

import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { AuthError, CredentialsSignin } from "next-auth";
import bcrypt from "bcryptjs";
import { registerSchema, changePasswordSchema } from "@/lib/validations";
import { redirect, unstable_rethrow } from "next/navigation";

export async function registerUser(formData: FormData) {
  const rawData = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    referralCode: (formData.get("referralCode") as string) || undefined,
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (existing) {
    return { error: "Ya existe una cuenta con este email" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

  let referredById: string | undefined;
  if (parsed.data.referralCode) {
    const referrer = await prisma.user.findUnique({
      where: { referralCode: parsed.data.referralCode },
    });
    if (referrer) {
      referredById = referrer.id;
    }
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashedPassword,
      referredById,
      status: "PENDING",
    },
  });

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/register/onboarding",
  });
}

export async function loginUser(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error: unknown) {
    // unstable_rethrow (API pública next/navigation) re-lanza errores
    // internos del framework: NEXT_REDIRECT, NEXT_NOT_FOUND, etc. Sustituye
    // al import privado `next/dist/client/components/redirect-error` que
    // Vercel rechaza en build strict. Ver next.js#76380.
    unstable_rethrow(error);

    if (error instanceof AuthError) {
      // authorize() dejó propagar un error de infra (Prisma, bcrypt, etc.).
      // Auth.js lo envuelve en AuthError pero conserva el original en cause.err.
      // Si cause.err existe y NO es una subclase de CredentialsSignin, es infra.
      const cause = (error as AuthError & { cause?: { err?: unknown } }).cause?.err;
      if (cause && !(cause instanceof CredentialsSignin)) {
        const name = cause instanceof Error ? cause.name : "UnknownError";
        const message = cause instanceof Error ? cause.message : String(cause);
        console.error("[loginUser] INFRA failure:", name, message);
        if (cause instanceof Error && cause.stack) console.error(cause.stack);
        return { error: "Servicio temporalmente no disponible. Inténtalo en unos segundos." };
      }

      // CredentialsSignin con code: viene de nuestras subclases en authorize().
      if (error.type === "CredentialsSignin") {
        const code = (error as AuthError & { code?: string }).code;
        if (code === "account_blocked") {
          return { error: "Tu cuenta está suspendida. Contacta a soporte." };
        }
        return { error: "Email o contraseña incorrectos" };
      }

      console.error("[loginUser] AuthError:", error.type, error.message);
      return { error: "Error de autenticación. Intenta de nuevo." };
    }

    console.error("[loginUser] Unexpected error:", error);
    return { error: "Error del servidor. Contacta soporte si persiste." };
  }
}

export async function loginWithDiscord() {
  await signIn("discord", { redirectTo: "/dashboard" });
}

export async function logoutUser() {
  await signOut({ redirectTo: "/login" });
}

export async function updateOnboarding(userId: string, step: number, data: Record<string, unknown>) {
  const updateData: Record<string, unknown> = { onboardingStep: step };

  if (step === 1) {
    updateData.country = data.country;
    updateData.playingLevel = data.playingLevel;
  } else if (step === 2) {
    updateData.primaryRoom = data.primaryRoom;
    updateData.secondaryRooms = data.secondaryRooms || [];
    updateData.weeklyHours = data.weeklyHours;
  } else if (step === 3) {
    updateData.goals = data.goals || [];
    if (data.nickname) updateData.nickname = data.nickname;
  }

  if (step >= 3) {
    updateData.onboardingStep = 4;
    updateData.status = "ACTIVE";
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });

  if (step >= 3) {
    redirect("/dashboard");
  }
}

export async function changePassword(userId: string, formData: FormData) {
  const rawData = {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const parsed = changePasswordSchema.safeParse(rawData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!isValid) return { error: "La contraseña actual es incorrecta" };

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { success: true };
}

export async function updateProfile(userId: string, data: Record<string, unknown>) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name as string,
      nickname: data.nickname as string | null,
      country: data.country as string | null,
      playingLevel: data.playingLevel as string | null,
      weeklyHours: data.weeklyHours as number | null,
      primaryRoom: data.primaryRoom as string | null,
    },
  });
  return { success: true };
}
