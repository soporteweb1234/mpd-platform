import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Diagnóstico de DB protegido. Sirve para verificar en prod:
//   - Conectividad de Prisma al Postgres actual
//   - Que el schema del cliente Prisma coincide con la DB (p.ej. columna
//     investedBalance Decimal tras c6b7a05) — si falla, el error de Prisma
//     aparece en el body con su message exacto.
//   - Presencia de al menos 1 admin (CredentialsSignin silencioso = user
//     no existe en esta DB).
//
// Acceso: header x-health-token === env HEALTH_TOKEN. Si HEALTH_TOKEN no
// está definido, el endpoint responde 503 (fail-closed) para no exponer
// info de infra por defecto.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const expected = process.env.HEALTH_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "HEALTH_TOKEN not configured on server" },
      { status: 503 }
    );
  }

  const provided = req.headers.get("x-health-token");
  if (provided !== expected) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const result: Record<string, unknown> = {
    ok: true,
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET),
      hasDiscordClientId: Boolean(process.env.DISCORD_CLIENT_ID),
      nodeEnv: process.env.NODE_ENV ?? null,
    },
  };

  try {
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
    });
    result.db = { reachable: true, userCount, adminCount };
  } catch (err) {
    result.ok = false;
    const name = err instanceof Error ? err.name : "UnknownError";
    const message = err instanceof Error ? err.message : String(err);
    result.db = { reachable: false, errorName: name, errorMessage: message };
    return NextResponse.json(result, { status: 500 });
  }

  // Schema coherence probe: fuerza Prisma a SELECT de todas las columnas
  // escalares del modelo User (incluida investedBalance). Si la columna
  // no existe en DB, aquí revienta con el nombre exacto.
  try {
    await prisma.user.findFirst({ select: { id: true, investedBalance: true } });
    result.schema = { userInvestedBalance: "ok" };
  } catch (err) {
    result.ok = false;
    const message = err instanceof Error ? err.message : String(err);
    result.schema = { userInvestedBalance: "missing_or_mismatch", errorMessage: message };
  }

  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
