import { TextChannel } from "discord.js";
import { getBotInstance } from "./bot";
import { prisma } from "@/lib/prisma";

export async function importChannelHistory(
  discordChannelId: string,
  mpdChannelId: string,
  limit = 500
) {
  const bot = getBotInstance();
  if (!bot) throw new Error("Bot not connected");

  const channel = await bot.channels.fetch(discordChannelId);
  if (!channel || !(channel instanceof TextChannel)) {
    throw new Error("Channel not found or not a text channel");
  }

  let imported = 0;
  let lastMessageId: string | undefined;
  const batchSize = 100;

  while (imported < limit) {
    const fetchLimit = Math.min(batchSize, limit - imported);
    const messages = await channel.messages.fetch({
      limit: fetchLimit,
      ...(lastMessageId ? { before: lastMessageId } : {}),
    });

    if (messages.size === 0) break;

    for (const [, msg] of messages) {
      if (msg.author.bot) continue;

      // Skip if already imported
      const existing = await prisma.message.findUnique({
        where: { discordMessageId: msg.id },
      });
      if (existing) continue;

      // Find linked MPD user
      const mpdUser = await prisma.user.findUnique({
        where: { discordId: msg.author.id },
      });

      await prisma.message.create({
        data: {
          channelId: mpdChannelId,
          userId: mpdUser?.id ?? null,
          content: msg.content,
          source: "DISCORD",
          discordMessageId: msg.id,
          discordAuthorName: mpdUser ? null : msg.author.displayName,
          discordAuthorAvatar: mpdUser
            ? null
            : msg.author.displayAvatarURL({ size: 64 }),
          isPinned: msg.pinned,
          createdAt: msg.createdAt,
        },
      });

      imported++;
    }

    lastMessageId = messages.last()?.id;
    if (messages.size < fetchLimit) break;
  }

  return imported;
}
