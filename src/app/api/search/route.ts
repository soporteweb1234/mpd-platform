import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hybridSearch } from "@/lib/ai/rag";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(2).max(200),
});

const WINDOW_MS = 10_000;
const MAX_REQUESTS = 10;

const buckets = new Map<string, { count: number; start: number }>();

function checkRate(userId: string): boolean {
  const now = Date.now();
  const b = buckets.get(userId);
  if (!b || now - b.start > WINDOW_MS) {
    buckets.set(userId, { count: 1, start: now });
    return true;
  }
  if (b.count >= MAX_REQUESTS) return false;
  b.count += 1;
  return true;
}

function preview(content: string, query: string, max = 200): string {
  const lc = content.toLowerCase();
  const q = query.toLowerCase();
  const idx = lc.indexOf(q);
  if (idx < 0) return content.slice(0, max);
  const startCandidate = Math.max(0, idx - Math.floor(max / 3));
  const end = Math.min(content.length, startCandidate + max);
  const start = Math.max(0, end - max);
  return (start > 0 ? "…" : "") + content.slice(start, end) + (end < content.length ? "…" : "");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const qParam = req.nextUrl.searchParams.get("q") ?? "";
  const parsed = querySchema.safeParse({ q: qParam });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Query inválida" },
      { status: 400 },
    );
  }

  if (!checkRate(session.user.id)) {
    return NextResponse.json(
      { error: "Demasiadas consultas — espera unos segundos" },
      { status: 429 },
    );
  }

  const chunks = await hybridSearch(parsed.data.q, 20, 10);

  const results = chunks.map((c) => ({
    chunkId: c.id,
    articleId: c.articleId,
    articleTitle: c.articleTitle ?? "Artículo",
    articleSlug: c.articleSlug ?? "",
    contentPreview: preview(c.content, parsed.data.q, 200),
    similarity: c.similarity ?? null,
    rrfScore: c.rrfScore,
  }));

  return NextResponse.json({ query: parsed.data.q, results });
}
