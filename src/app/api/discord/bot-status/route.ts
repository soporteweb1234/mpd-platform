import { NextResponse } from "next/server";
import { isBotConnected, getBotInstance } from "@/lib/discord/bot";
import { requireAdmin, authzResponse } from "@/lib/auth/guards";

async function handler() {
  try {
    await requireAdmin();
  } catch (err) {
    return authzResponse(err);
  }

  const connected = isBotConnected();
  const bot = getBotInstance();

  return NextResponse.json({
    status: connected ? "connected" : "disconnected",
    botUser:
      connected && bot?.user ? { tag: bot.user.tag, id: bot.user.id } : null,
  });
}

export const GET = handler;
export const POST = handler;
