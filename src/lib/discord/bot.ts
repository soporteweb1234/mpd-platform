import {
  Client,
  GatewayIntentBits,
  Partials,
  TextChannel,
  type Message as DiscordMessage,
  type PartialMessage,
} from "discord.js";
import { prisma } from "@/lib/prisma";

// Use globalThis to share the bot singleton across all Next.js webpack entry points
// (instrumentation, API routes, server actions all get their own module copies,
// but globalThis is shared across the entire Node.js process)
const globalForDiscord = globalThis as unknown as {
  discordBot: Client | null;
  discordGuildId: string | null;
};

if (!globalForDiscord.discordBot) {
  globalForDiscord.discordBot = null;
}
if (!globalForDiscord.discordGuildId) {
  globalForDiscord.discordGuildId = null;
}

function getBotInstanceInternal(): Client | null {
  return globalForDiscord.discordBot;
}

function setBotInstance(client: Client | null) {
  globalForDiscord.discordBot = client;
}

function getGuildId(): string | null {
  return globalForDiscord.discordGuildId;
}

function setGuildId(id: string | null) {
  globalForDiscord.discordGuildId = id;
}

export function getBotInstance() {
  return getBotInstanceInternal();
}

export function isBotConnected(): boolean {
  const bot = getBotInstanceInternal();
  return bot !== null && bot.isReady();
}

export async function startDiscordBot(token: string, guildId: string): Promise<Client> {
  // Destroy previous instance if exists
  const existing = getBotInstanceInternal();
  if (existing) {
    try { await existing.destroy(); } catch { /* ignore */ }
    setBotInstance(null);
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

  setGuildId(guildId);

  // Wait for the ready event before resolving
  const readyPromise = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Bot connection timed out after 15s"));
    }, 15000);

    client.once("ready", () => {
      clearTimeout(timeout);
      console.log(`[Discord Bot] ✅ Discord bot connected as ${client.user?.tag}`);
      setBotInstance(client);
      resolve();
    });

    client.once("error", (err) => {
      clearTimeout(timeout);
      console.error(`[Discord Bot] ❌ Connection error:`, err);
      reject(err);
    });
  });

  // Register all event handlers BEFORE login
  registerMessageHandlers(client, guildId);

  // Login and wait for ready
  await client.login(token);
  await readyPromise;

  console.log(`[Discord Bot] Ready and listening on guild ${guildId}`);
  return client;
}

function registerMessageHandlers(client: Client, guildId: string) {
  // New message from Discord
  client.on("messageCreate", async (message: DiscordMessage) => {
    // Ignore bot messages (prevents loop when bot sends on behalf of web users)
    if (message.author.bot) return;
    if (message.guildId !== guildId) return;

    try {
      // Find linked channel
      const channel = await prisma.channel.findUnique({
        where: { discordChannelId: message.channelId },
      });
      if (!channel) return;

      // Check if this message already exists (dedup safety)
      const existing = await prisma.message.findUnique({
        where: { discordMessageId: message.id },
      });
      if (existing) return;

      // Find linked MPD user by discordId
      const mpdUser = message.author.id
        ? await prisma.user.findUnique({
            where: { discordId: message.author.id },
          })
        : null;

      // Resolve reply reference
      let replyToId: string | null = null;
      if (message.reference?.messageId) {
        const replyMsg = await prisma.message.findUnique({
          where: { discordMessageId: message.reference.messageId },
          select: { id: true },
        });
        replyToId = replyMsg?.id ?? null;
      }

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
          replyToId,
        },
      });

      console.log(`[Discord Bot] Discord message received in #${channel.name}: ${message.content.slice(0, 80)}`);
    } catch (error) {
      console.error("[Discord Bot] Error handling messageCreate:", error);
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
}

/**
 * Send a message from web to Discord.
 * Returns the Discord message ID if sent successfully.
 */
export async function sendToDiscord(
  channelDiscordId: string,
  authorName: string,
  authorStratum: string,
  content: string
): Promise<string | null> {
  const bot = getBotInstanceInternal();
  if (!bot || !bot.isReady()) {
    console.warn("[Discord Bot] Cannot send — bot not connected (botInstance is null:", bot === null, ")");
    return null;
  }

  try {
    console.log(`[Discord Bot] Sending to Discord #${channelDiscordId}: ${content.slice(0, 80)}`);
    const channel = await bot.channels.fetch(channelDiscordId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.warn(`[Discord Bot] Error: Channel ${channelDiscordId} not found or not text channel`);
      return null;
    }

    const stratumLabel = STRATUM_LABELS[authorStratum] ?? authorStratum;
    const sent = await channel.send(`**[${authorName} | ${stratumLabel}]** ${content}`);
    console.log(`[Web → Discord] #${channel.name}: ${authorName}: ${content.slice(0, 50)}`);
    return sent.id;
  } catch (error) {
    console.error("[Discord Bot] Error sending to Discord:", error);
    return null;
  }
}

const STRATUM_LABELS: Record<string, string> = {
  NOVATO: "Novato",
  SEMI_PRO: "Semi-Pro",
  PROFESIONAL: "Profesional",
  REFERENTE: "Referente",
};

/**
 * Edit a bot message in Discord.
 */
export async function editInDiscord(
  channelDiscordId: string,
  discordMessageId: string,
  authorName: string,
  authorStratum: string,
  content: string
): Promise<boolean> {
  const bot = getBotInstanceInternal();
  if (!bot || !bot.isReady()) return false;

  try {
    const channel = await bot.channels.fetch(channelDiscordId);
    if (!channel || !(channel instanceof TextChannel)) return false;

    const message = await channel.messages.fetch(discordMessageId);
    if (!message.editable) return false;

    const stratumLabel = STRATUM_LABELS[authorStratum] ?? authorStratum;
    await message.edit(`**[${authorName} | ${stratumLabel}]** ${content}`);
    return true;
  } catch (error) {
    console.error("[Discord Bot] Error editing in Discord:", error);
    return false;
  }
}

/**
 * Delete a bot message in Discord.
 */
export async function deleteInDiscord(
  channelDiscordId: string,
  discordMessageId: string
): Promise<boolean> {
  const bot = getBotInstanceInternal();
  if (!bot || !bot.isReady()) return false;

  try {
    const channel = await bot.channels.fetch(channelDiscordId);
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
  const bot = getBotInstanceInternal();
  if (bot) {
    try { await bot.destroy(); } catch { /* ignore */ }
    setBotInstance(null);
    setGuildId(null);
    console.log("[Discord Bot] Stopped");
  }
}

/**
 * Get list of text channels from the guild.
 */
export async function getGuildChannels(guildId: string) {
  const bot = getBotInstanceInternal();
  if (!bot || !bot.isReady()) return [];

  try {
    const guild = await bot.guilds.fetch(guildId);
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

/**
 * Auto-start bot from SystemSetting values.
 * Called on server init or from API route.
 */
export async function autoStartBot(): Promise<boolean> {
  const existing = getBotInstanceInternal();
  if (existing && existing.isReady()) {
    console.log("[Discord Bot] Already connected, skipping auto-start");
    return true;
  }

  try {
    // Read from SystemSetting
    const tokenSetting = await prisma.systemSetting.findUnique({
      where: { key: "DISCORD_BOT_TOKEN" },
    });
    const guildSetting = await prisma.systemSetting.findUnique({
      where: { key: "DISCORD_GUILD_ID" },
    });

    const token = tokenSetting?.value ?? process.env.DISCORD_BOT_TOKEN;
    const guildId = guildSetting?.value ?? process.env.DISCORD_GUILD_ID;

    if (!token || !guildId) {
      console.log("[Discord Bot] No token or guild ID configured, skipping auto-start");
      return false;
    }

    await startDiscordBot(token, guildId);
    return true;
  } catch (error) {
    console.error("[Discord Bot] Auto-start failed:", error);
    return false;
  }
}
