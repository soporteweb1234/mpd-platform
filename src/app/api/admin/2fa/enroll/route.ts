import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authzResponse } from "@/lib/auth/guards";
import { generateSecret, qrCodeDataUrl } from "@/lib/security/twofa";

/**
 * POST /api/admin/2fa/enroll
 * Genera (o regenera) el secret TOTP del admin en curso y devuelve el QR.
 * Idempotente hasta que se verifica (solo se persiste con `twoFactorEnabled = true`
 * al pasar por /api/admin/2fa/verify).
 */
export async function POST() {
  let session;
  try {
    session = await requireAdmin();
  } catch (err) {
    return authzResponse(err);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, twoFactorEnabled: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }
  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "2FA ya está activo. Contacta a soporte para regenerar." },
      { status: 400 },
    );
  }

  const secret = generateSecret();
  const qr = await qrCodeDataUrl(user.email, secret);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({ secret, qr });
}
