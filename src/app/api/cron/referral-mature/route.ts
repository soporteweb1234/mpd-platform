import { NextResponse } from "next/server";
import { maturePendingReferrals } from "@/lib/referrals/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await maturePendingReferrals();
  return NextResponse.json({ ok: true, ...result });
}
