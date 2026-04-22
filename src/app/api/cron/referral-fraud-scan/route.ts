import { NextResponse } from "next/server";
import {
  scanSameIpClusters,
  scanSelfReferralPatterns,
  persistFraudFlags,
} from "@/lib/referrals/fraud";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const ipCandidates = await scanSameIpClusters();
  const selfCandidates = await scanSelfReferralPatterns();
  const all = [...ipCandidates, ...selfCandidates];
  const result = await persistFraudFlags(all);

  return NextResponse.json({
    ok: true,
    scanned: all.length,
    flagsCreated: result.created,
    holdApplied: result.holdApplied,
  });
}
