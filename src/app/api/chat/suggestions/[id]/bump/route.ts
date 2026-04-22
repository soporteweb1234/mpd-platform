import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/chat/suggestions/[id]/bump
 * Incrementa timesAsked para alimentar el sort de chips populares.
 * No-op si la sugerencia no existe o está inactiva (evita errores en UI).
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  try {
    await prisma.suggestedQuestion.update({
      where: { id },
      data: { timesAsked: { increment: 1 } },
    });
  } catch {
    // Ignora si no existe — el bump es informativo, no crítico.
    return NextResponse.json({ ok: false }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
