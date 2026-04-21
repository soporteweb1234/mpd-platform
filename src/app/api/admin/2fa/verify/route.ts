import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authzResponse } from "@/lib/auth/guards";
import {
  verifyTotp,
  generateBackupCodes,
  hashBackupCodes,
} from "@/lib/security/twofa";
import { rateLimit, RateLimits } from "@/lib/security/ratelimit";

/**
 * POST /api/admin/2fa/verify { code }
 * Valida el código TOTP contra el secret persistido en enroll.
 * Al éxito: activa 2FA, genera 10 códigos de respaldo (hasheados en DB,
 * devueltos en claro UNA sola vez), escribe ActivityLog.
 */
export async function POST(request: Request) {
  let session;
  try {
    session = await requireAdmin();
  } catch (err) {
    return authzResponse(err);
  }

  const rl = await rateLimit(RateLimits.twoFactorVerify, session.user.id);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos." },
      { status: 429 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { code?: string };
  const code = (body.code ?? "").trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });
  if (!user?.twoFactorSecret) {
    return NextResponse.json(
      { error: "Primero solicita el QR en enroll" },
      { status: 400 },
    );
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA ya estaba activo" },
      { status: 400 },
    );
  }

  const ok = await verifyTotp(code, user.twoFactorSecret);
  if (!ok) {
    return NextResponse.json({ error: "Código incorrecto" }, { status: 401 });
  }

  const plainCodes = generateBackupCodes(10);
  const hashed = await hashBackupCodes(plainCodes);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        twoFactorEnabled: true,
        backupCodes: hashed,
        lastTwoFactorAt: new Date(),
      },
    }),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "TWO_FACTOR_ENABLED",
        entityType: "user",
        entityId: session.user.id,
      },
    }),
  ]);

  return NextResponse.json({ success: true, backupCodes: plainCodes });
}
