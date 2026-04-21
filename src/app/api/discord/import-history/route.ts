import { NextResponse } from "next/server";
import { importChannelHistory } from "@/lib/discord/sync";
import { requireAdmin, authzResponse } from "@/lib/auth/guards";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch (err) {
    return authzResponse(err);
  }

  const body = await request.json();
  const { discordChannelId, mpdChannelId, limit = 500 } = body;

  if (!discordChannelId || !mpdChannelId) {
    return NextResponse.json(
      { error: "discordChannelId and mpdChannelId are required" },
      { status: 400 }
    );
  }

  try {
    const imported = await importChannelHistory(
      discordChannelId,
      mpdChannelId,
      limit
    );
    return NextResponse.json({ imported });
  } catch (error) {
    console.error("[Discord API] Import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
