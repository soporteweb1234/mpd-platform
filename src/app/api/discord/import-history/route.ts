import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importChannelHistory } from "@/lib/discord/sync";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
