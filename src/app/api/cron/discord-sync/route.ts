import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { syncDiscordRole } from "@/lib/discord/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const provided = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      discordId: { not: null },
      discordConnected: true,
    },
    select: { id: true, discordId: true, stratum: true },
    take: 100,
    orderBy: { updatedAt: "asc" },
  });

  let synced = 0;
  let failed = 0;
  const errors: Array<{ userId: string; error?: string }> = [];

  for (const u of users) {
    if (!u.discordId) continue;
    const r = await syncDiscordRole({
      userId: u.id,
      discordId: u.discordId,
      toStratum: u.stratum,
      source: "cron_reconcile",
    });
    if (r.success) synced++;
    else {
      failed++;
      if (errors.length < 10) errors.push({ userId: u.id, error: r.error });
    }
    await new Promise((res) => setTimeout(res, 200));
  }

  return NextResponse.json({
    ok: true,
    scanned: users.length,
    synced,
    failed,
    errors,
  });
}
