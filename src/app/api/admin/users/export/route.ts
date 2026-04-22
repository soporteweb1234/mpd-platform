import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { toNum } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authz = await checkAdmin();
  if ("error" in authz) {
    return NextResponse.json({ error: authz.error }, { status: 403 });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("q")?.trim() ?? "";
  const stratum = url.searchParams.get("stratum");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { deletedAt: null };
  if (stratum) where.stratum = stratum;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { nickname: { contains: search, mode: "insensitive" } },
    ];
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, email: true, nickname: true, country: true,
      role: true, stratum: true, status: true,
      totalRakeback: true, availableBalance: true, pendingBalance: true,
      investedBalance: true, createdAt: true,
    },
  });

  const monthAgg = await prisma.rakebackRecord.groupBy({
    by: ["userId"],
    where: {
      userId: { in: users.map((u) => u.id) },
      periodStart: { gte: monthStart },
    },
    _sum: { rakebackAmount: true },
  });
  const monthMap = new Map(monthAgg.map((r) => [r.userId, toNum(r._sum.rakebackAmount)]));

  const header = [
    "id", "name", "email", "nickname", "country", "role", "stratum", "status",
    "rakeback_total", "rakeback_mes", "saldo_disponible", "saldo_pendiente",
    "saldo_invertido", "registro",
  ];
  const rows = users.map((u) => [
    u.id,
    csvEscape(u.name),
    csvEscape(u.email),
    csvEscape(u.nickname ?? ""),
    csvEscape(u.country ?? ""),
    u.role,
    u.stratum,
    u.status,
    toNum(u.totalRakeback).toFixed(2),
    (monthMap.get(u.id) ?? 0).toFixed(2),
    toNum(u.availableBalance).toFixed(2),
    toNum(u.pendingBalance).toFixed(2),
    toNum(u.investedBalance).toFixed(2),
    u.createdAt.toISOString(),
  ]);
  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  const stamp = now.toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="usuarios-mpd-${stamp}.csv"`,
    },
  });
}

function csvEscape(s: string): string {
  if (s == null) return "";
  const needsQuote = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}
