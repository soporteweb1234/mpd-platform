import { NextResponse } from "next/server";
import { isBotConnected, getBotInstance } from "@/lib/discord/bot";

export async function GET() {
  const connected = isBotConnected();
  const bot = getBotInstance();

  return NextResponse.json({
    status: connected ? "connected" : "disconnected",
    botUser: connected && bot?.user
      ? { tag: bot.user.tag, id: bot.user.id }
      : null,
  });
}

export async function POST() {
  // Alias for GET — used by admin panel
  const connected = isBotConnected();
  const bot = getBotInstance();

  return NextResponse.json({
    status: connected ? "connected" : "disconnected",
    botUser: connected && bot?.user
      ? { tag: bot.user.tag, id: bot.user.id }
      : null,
  });
}
