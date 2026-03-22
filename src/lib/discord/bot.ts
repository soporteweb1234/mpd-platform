import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
  type Message as DiscordMessage,
  type PartialMessage,
} from "discord.js";
import { prisma } from "@/lib/prisma";

let botInstance: Client | null = null;

export function getBotInstance() {
  return botInstance;
}

export async function startDiscordBot(token: string, guildId: string) {
  if (botInstance) {
    await botInstance.destroy();
  }

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
    botInstance = client;
  });

  // New message from Discord
  client.on("messageCreate", async (message: DiscordMessage) => {
    if (message.author.bot) return;
    if (message.guildId !== guildId) return;

    try {
      // Find linked channel
      const channel = await prisma.channel.findUnique({
        where: { discordChannelId: message.channelId },
      });
      if (!channel) return;

      // Find linked MPD user
      const mpdUser = await prisma.user.findUnique({
        where: { discordId: message.author.id },
      });

      // Save message to DB
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
          replyToId: message.reference?.messageId
            ? (
                await prisma.message.findUnique({
                  where: { discordMessageId: message.reference.messageId },
                  select: { id: true },
                })
              )?.id ?? null
            : null,
        },
      });
    } catch (error) {
      console.error("[Discord Bot] Error handling message:", error);
    }
  });

  // Message edited in Discord
  client.on(
    "messageUpdate",
    async (_old: DiscordMessage | PartialMessage, newMsg: DiscordMessage | PartialMessage) => {
      if (newMsg.author?.bot) return;

      try {
        if (!newMsg.content) return;
        const dbMessage = await prisma.message.findUnique({
          where: { discordMessageId: newMsg.id },
        });
        if (!dbMessage) return;

        await prisma.message.update({
          where: { id: dbMessage.id },
          data: {
            content: newMsg.content,
            isEdited: true,
            editedAt: new Date(),
          },
        });
      } catch (error) {
        console.error("[Discord Bot] Error handling message edit:", error);
      }
    }
  );

  // Message deleted in Discord
  client.on("messageDelete", async (message: DiscordMessage | PartialMessage) => {
    try {
      const dbMessage = await prisma.message.findUnique({
        where: { discordMessageId: message.id },
      });
      if (!dbMessage) return;

      await prisma.message.update({
        where: { id: dbMessage.id },
        data: { deletedAt: new Date() },
      });
    } catch (error) {
      console.error("[Discord Bot] Error handling message delete:", error);
    }
  });

  // Reaction added in Discord
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
        create: {
          messageId: dbMessage.id,
          userId: mpdUser.id,
          emoji,
        },
        update: {},
      });
    } catch (error) {
      console.error("[Discord Bot] Error handling reaction:", error);
    }
  });

  // Reaction removed in Discord
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
        where: {
          messageId: dbMessage.id,
          userId: mpdUser.id,
          emoji,
        },
      });
    } catch (error) {
      console.error("[Discord Bot] Error handling reaction remove:", error);
    }
  });

  // Message pinned/unpinned
  client.on("channelPinsUpdate", async (channel) => {
    try {
      const dbChannel = await prisma.channel.findUnique({
        where: { discordChannelId: channel.id },
      });
      if (!dbChannel) return;

      if (channel instanceof TextChannel) {
        const pinnedMessages = await channel.messages.fetchPinned();
        const pinnedDiscordIds = pinnedMessages.map((m) => m.id);

        // Unpin all, then pin the ones that are pinned in Discord
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
      console.error("[Discord Bot] Error handling pins update:", error);
    }
  });

  await client.login(token);
  return client;
}

// Send a web message to Discord
export async function sendToDiscord(
  channelDiscordId: string,
  authorName: string,
  content: string
): Promise<string | null> {
  if (!botInstance) return null;

  try {
    const channel = await botInstance.channels.fetch(channelDiscordId);
    if (!channel || !(channel instanceof TextChannel)) return null;

    const sent = await channel.send(`**[${authorName}]** ${content}`);
    return sent.id;
  } catch (error) {
    console.error("[Discord Bot] Error sending to Discord:", error);
    return null;
  }
}

// Edit a message in Discord
export async function editInDiscord(
  channelDiscordId: string,
  discordMessageId: string,
  authorName: string,
  content: string
): Promise<boolean> {
  if (!botInstance) return false;

  try {
    const channel = await botInstance.channels.fetch(channelDiscordId);
    if (!channel || !(channel instanceof TextChannel)) return false;

    const message = await channel.messages.fetch(discordMessageId);
    if (!message.editable) return false;

    await message.edit(`**[${authorName}]** ${content}`);
    return true;
  } catch (error) {
    console.error("[Discord Bot] Error editing in Discord:", error);
    return false;
  }
}

// Delete a message in Discord
export async function deleteInDiscord(
  channelDiscordId: string,
  discordMessageId: string
): Promise<boolean> {
  if (!botInstance) return false;

  try {
    const channel = await botInstance.channels.fetch(channelDiscordId);
    if (!channel || !(channel instanceof TextChannel)) return false;

    const message = await channel.messages.fetch(discordMessageId);
    if (!message.deletable) return false;

    await message.delete();
    return true;
  } catch (error) {
    console.error("[Discord Bot] Error deleting in Discord:", error);
    return false;
  }
}

export async function stopDiscordBot() {
  if (botInstance) {
    await botInstance.destroy();
    botInstance = null;
  }
}

// Get list of text channels from the guild
export async function getGuildChannels(guildId: string) {
  if (!botInstance) return [];

  try {
    const guild = await botInstance.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    return channels
      .filter((c) => c?.type === 0) // TextChannel type
      .map((c) => ({
        id: c!.id,
        name: c!.name,
        position: c!.position,
      }))
      .sort((a, b) => a.position - b.position);
  } catch (error) {
    console.error("[Discord Bot] Error fetching guild channels:", error);
    return [];
  }
}
