/**
 * Standalone Discord bot script.
 * Run with: npm run discord-bot
 *
 * Reads Bot Token and Guild ID from SystemSetting table,
 * connects the bot, and listens for messages on linked channels.
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
  type Message as DiscordMessage,
  type PartialMessage,
} from "discord.js";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("[Discord Bot] Starting standalone bot...");

  // Read config from SystemSetting
  const tokenSetting = await prisma.systemSetting.findUnique({
    where: { key: "DISCORD_BOT_TOKEN" },
  });
  const guildSetting = await prisma.systemSetting.findUnique({
    where: { key: "DISCORD_GUILD_ID" },
  });

  const token = tokenSetting?.value ?? process.env.DISCORD_BOT_TOKEN;
  const guildId = guildSetting?.value ?? process.env.DISCORD_GUILD_ID;

  if (!token) {
    console.error("[Discord Bot] No DISCORD_BOT_TOKEN found in SystemSetting or env");
    process.exit(1);
  }
  if (!guildId) {
    console.error("[Discord Bot] No DISCORD_GUILD_ID found in SystemSetting or env");
    process.exit(1);
  }

  // List linked channels for info
  const linkedChannels = await prisma.channel.findMany({
    where: { discordChannelId: { not: null } },
    select: { name: true, discordChannelId: true },
  });
  console.log(`[Discord Bot] Found ${linkedChannels.length} linked channel(s):`);
  for (const ch of linkedChannels) {
    console.log(`  - #${ch.name} → Discord ${ch.discordChannelId}`);
  }

  // Create Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Reaction],
  });

  client.once("ready", () => {
    console.log(`[Discord Bot] Logged in as ${client.user?.tag}`);
    console.log(`[Discord Bot] Listening on guild ${guildId}`);
  });

  // --- Message handlers ---

  client.on("messageCreate", async (message: DiscordMessage) => {
    // Ignore ALL bot messages (prevents infinite loops)
    if (message.author.bot) return;
    if (message.guildId !== guildId) return;

    try {
      const channel = await prisma.channel.findUnique({
        where: { discordChannelId: message.channelId },
      });
      if (!channel) return;

      // Dedup check
      const existing = await prisma.message.findUnique({
        where: { discordMessageId: message.id },
      });
      if (existing) return;

      // Find linked MPD user
      const mpdUser = await prisma.user.findUnique({
        where: { discordId: message.author.id },
      });

      // Resolve reply
      let replyToId: string | null = null;
      if (message.reference?.messageId) {
        const replyMsg = await prisma.message.findUnique({
          where: { discordMessageId: message.reference.messageId },
          select: { id: true },
        });
        replyToId = replyMsg?.id ?? null;
      }

      await prisma.message.create({
        data: {
          channelId: channel.id,
          userId: mpdUser?.id ?? null,
          content: message.content,
          source: "DISCORD",
          discordMessageId: message.id,
          discordAuthorName: mpdUser ? null : message.author.displayName,
          discordAuthorAvatar: mpdUser
            ? null
            : message.author.displayAvatarURL({ size: 64 }),
          replyToId,
        },
      });

      console.log(
        `[Discord → DB] #${channel.name}: ${message.author.displayName}: ${message.content.slice(0, 80)}`
      );
    } catch (error) {
      console.error("[Discord Bot] Error handling message:", error);
    }
  });

  client.on(
    "messageUpdate",
    async (
      _old: DiscordMessage | PartialMessage,
      newMsg: DiscordMessage | PartialMessage
    ) => {
      if (newMsg.author?.bot) return;
      try {
        if (!newMsg.content) return;
        const dbMessage = await prisma.message.findUnique({
          where: { discordMessageId: newMsg.id },
        });
        if (!dbMessage) return;

        await prisma.message.update({
          where: { id: dbMessage.id },
          data: { content: newMsg.content, isEdited: true, editedAt: new Date() },
        });
        console.log(`[Discord → DB] Message edited: ${newMsg.id}`);
      } catch (error) {
        console.error("[Discord Bot] Error handling edit:", error);
      }
    }
  );

  client.on(
    "messageDelete",
    async (message: DiscordMessage | PartialMessage) => {
      try {
        const dbMessage = await prisma.message.findUnique({
          where: { discordMessageId: message.id },
        });
        if (!dbMessage) return;

        await prisma.message.update({
          where: { id: dbMessage.id },
          data: { deletedAt: new Date() },
        });
        console.log(`[Discord → DB] Message deleted: ${message.id}`);
      } catch (error) {
        console.error("[Discord Bot] Error handling delete:", error);
      }
    }
  );

  client.on("messageReactionAdd", async (reaction, user) => {
    if (user.bot) return;
    try {
      const dbMessage = await prisma.message.findUnique({
        where: { discordMessageId: reaction.message.id },
      });
      if (!dbMessage) return;

      const mpdUser = await prisma.user.findUnique({
        where: { discordId: user.id },
      });
      if (!mpdUser) return;

      const emoji = reaction.emoji.name ?? "❓";
      await prisma.reaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId: dbMessage.id,
            userId: mpdUser.id,
            emoji,
          },
        },
        create: { messageId: dbMessage.id, userId: mpdUser.id, emoji },
        update: {},
      });
    } catch (error) {
      console.error("[Discord Bot] Error handling reaction:", error);
    }
  });

  client.on("messageReactionRemove", async (reaction, user) => {
    if (user.bot) return;
    try {
      const dbMessage = await prisma.message.findUnique({
        where: { discordMessageId: reaction.message.id },
      });
      if (!dbMessage) return;

      const mpdUser = await prisma.user.findUnique({
        where: { discordId: user.id },
      });
      if (!mpdUser) return;

      const emoji = reaction.emoji.name ?? "❓";
      await prisma.reaction.deleteMany({
        where: { messageId: dbMessage.id, userId: mpdUser.id, emoji },
      });
    } catch (error) {
      console.error("[Discord Bot] Error handling reaction remove:", error);
    }
  });

  client.on("channelPinsUpdate", async (channel) => {
    try {
      const dbChannel = await prisma.channel.findUnique({
        where: { discordChannelId: channel.id },
      });
      if (!dbChannel) return;

      if (channel instanceof TextChannel) {
        const pinnedMessages = await channel.messages.fetchPinned();
        const pinnedDiscordIds = pinnedMessages.map((m) => m.id);

        await prisma.message.updateMany({
          where: { channelId: dbChannel.id, isPinned: true },
          data: { isPinned: false },
        });

        if (pinnedDiscordIds.length > 0) {
          await prisma.message.updateMany({
            where: {
              channelId: dbChannel.id,
              discordMessageId: { in: pinnedDiscordIds },
            },
            data: { isPinned: true },
          });
        }
      }
    } catch (error) {
      console.error("[Discord Bot] Error handling pins:", error);
    }
  });

  // Login
  await client.login(token);
  console.log("[Discord Bot] Bot is running. Press Ctrl+C to stop.");

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n[Discord Bot] Shutting down...");
    client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n[Discord Bot] Shutting down...");
    client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("[Discord Bot] Fatal error:", error);
  process.exit(1);
});
