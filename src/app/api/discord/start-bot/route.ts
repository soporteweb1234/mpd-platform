import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startDiscordBot, stopDiscordBot, getBotInstance } from "@/lib/discord/bot";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action ?? "start";

  if (action === "stop") {
    await stopDiscordBot();
    return NextResponse.json({ status: "stopped" });
  }

  if (action === "status") {
    return NextResponse.json({
      status: getBotInstance() ? "connected" : "disconnected",
    });
  }

  // Get token and guild ID from SystemSetting or env
  let token = process.env.DISCORD_BOT_TOKEN;
  let guildId = process.env.DISCORD_GUILD_ID;

  const tokenSetting = await prisma.systemSetting.findUnique({
    where: { key: "DISCORD_BOT_TOKEN" },
  });
  if (tokenSetting) token = tokenSetting.value;

  const guildSetting = await prisma.systemSetting.findUnique({
    where: { key: "DISCORD_GUILD_ID" },
  });
  if (guildSetting) guildId = guildSetting.value;

  if (!token || !guildId) {
    return NextResponse.json(
      { error: "Discord bot token or guild ID not configured" },
      { status: 400 }
    );
  }

  try {
    await startDiscordBot(token, guildId);
    return NextResponse.json({ status: "connected" });
  } catch (error) {
    console.error("[Discord API] Failed to start bot:", error);
    return NextResponse.json(
      { error: "Failed to connect bot" },
      { status: 500 }
    );
  }
}
