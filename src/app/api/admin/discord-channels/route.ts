import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGuildChannels } from "@/lib/discord/bot";

export async function GET() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let guildId = process.env.DISCORD_GUILD_ID;
  const setting = await prisma.systemSetting.findUnique({
    where: { key: "DISCORD_GUILD_ID" },
  });
  if (setting) guildId = setting.value;

  if (!guildId) {
    return NextResponse.json([]);
  }

  const channels = await getGuildChannels(guildId);
  return NextResponse.json(channels);
}
