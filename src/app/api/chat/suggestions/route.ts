import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/chat/suggestions
 * Devuelve top 6 SuggestedQuestion activas, orden priority DESC → timesAsked DESC.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const rows = await prisma.suggestedQuestion.findMany({
    where: { active: true },
    select: { id: true, question: true, category: true },
    orderBy: [{ priority: "desc" }, { timesAsked: "desc" }],
    take: 6,
  });

  return NextResponse.json({ suggestions: rows });
}
