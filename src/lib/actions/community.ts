"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToDiscord, editInDiscord, deleteInDiscord } from "@/lib/discord/bot";
import type { PlayerStratum, UserRole } from "@prisma/client";

// Stratum hierarchy for access control
const STRATUM_ORDER: PlayerStratum[] = ["NOVATO", "SEMI_PRO", "PROFESIONAL", "REFERENTE"];

function hasStratumAccess(userStratum: PlayerStratum, required: PlayerStratum | null): boolean {
  if (!required) return true;
  return STRATUM_ORDER.indexOf(userStratum) >= STRATUM_ORDER.indexOf(required);
}

function hasRoleAccess(userRole: UserRole, required: UserRole | null): boolean {
  if (!required) return true;
  const adminRoles: UserRole[] = ["ADMIN", "SUPER_ADMIN"];
  if (adminRoles.includes(required)) return adminRoles.includes(userRole);
  return true;
}

export async function getChannels() {
  const session = await auth();
  if (!session?.user) return [];

  const channels = await prisma.channel.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { messages: true } },
      members: {
        where: { userId: session.user.id },
        select: { lastReadAt: true },
      },
    },
  });

  return channels.map((ch) => ({
    ...ch,
    hasAccess:
      hasStratumAccess(session.user.stratum, ch.requiredStratum) &&
      hasRoleAccess(session.user.role, ch.requiredRole),
    lastReadAt: ch.members[0]?.lastReadAt ?? null,
    members: undefined,
  }));
}

export async function getChannelMessages(
  channelId: string,
  cursor?: string,
  limit = 50
) {
  const session = await auth();
  if (!session?.user) return { messages: [], nextCursor: null };

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });
  if (!channel) return { messages: [], nextCursor: null };

  if (
    !hasStratumAccess(session.user.stratum, channel.requiredStratum) ||
    !hasRoleAccess(session.user.role, channel.requiredRole)
  ) {
    return { messages: [], nextCursor: null };
  }

  const messages = await prisma.message.findMany({
    where: {
      channelId,
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          stratum: true,
          role: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          user: { select: { name: true, nickname: true } },
          discordAuthorName: true,
        },
      },
      reactions: {
        select: { id: true, emoji: true, userId: true },
      },
    },
  });

  const hasMore = messages.length > limit;
  const trimmed = hasMore ? messages.slice(0, limit) : messages;

  // Update last read
  await prisma.channelMember.upsert({
    where: {
      channelId_userId: { channelId, userId: session.user.id },
    },
    create: {
      channelId,
      userId: session.user.id,
      lastReadAt: new Date(),
    },
    update: { lastReadAt: new Date() },
  });

  return {
    messages: trimmed.reverse(),
    nextCursor: hasMore ? trimmed[0]?.id : null,
  };
}

export async function sendMessage(channelId: string, content: string, replyToId?: string) {
  const session = await auth();
  if (!session?.user) return null;

  const trimmed = content.trim();
  if (!trimmed) return null;

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
  });
  if (!channel) return null;

  if (
    !hasStratumAccess(session.user.stratum, channel.requiredStratum) ||
    !hasRoleAccess(session.user.role, channel.requiredRole)
  ) {
    return null;
  }

  // Save to DB
  const message = await prisma.message.create({
    data: {
      channelId,
      userId: session.user.id,
      content: trimmed,
      source: "WEB",
      replyToId: replyToId || null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          stratum: true,
          role: true,
        },
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          user: { select: { name: true, nickname: true } },
          discordAuthorName: true,
        },
      },
      reactions: true,
    },
  });

  // Sync to Discord if channel is linked
  if (channel.discordChannelId) {
    const authorName = session.user.name;
    const discordMsgId = await sendToDiscord(
      channel.discordChannelId,
      authorName,
      trimmed
    );
    if (discordMsgId) {
      await prisma.message.update({
        where: { id: message.id },
        data: { discordMessageId: discordMsgId },
      });
    }
  }

  return message;
}

export async function editMessage(messageId: string, content: string) {
  const session = await auth();
  if (!session?.user) return null;

  const trimmed = content.trim();
  if (!trimmed) return null;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message) return null;

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (message.userId !== session.user.id && !isAdmin) return null;

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { content: trimmed, isEdited: true, editedAt: new Date() },
  });

  // Sync edit to Discord
  if (message.discordMessageId && message.channel.discordChannelId) {
    await editInDiscord(
      message.channel.discordChannelId,
      message.discordMessageId,
      session.user.name,
      trimmed
    );
  }

  return updated;
}

export async function deleteMessage(messageId: string) {
  const session = await auth();
  if (!session?.user) return false;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: { channel: true },
  });
  if (!message) return false;

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (message.userId !== session.user.id && !isAdmin) return false;

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  // Sync delete to Discord
  if (message.discordMessageId && message.channel.discordChannelId) {
    await deleteInDiscord(
      message.channel.discordChannelId,
      message.discordMessageId
    );
  }

  return true;
}

export async function togglePin(messageId: string) {
  const session = await auth();
  if (!session?.user) return false;

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
  if (!isAdmin) return false;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
  });
  if (!message) return false;

  await prisma.message.update({
    where: { id: messageId },
    data: { isPinned: !message.isPinned },
  });

  return true;
}

export async function toggleReaction(messageId: string, emoji: string) {
  const session = await auth();
  if (!session?.user) return false;

  const existing = await prisma.reaction.findUnique({
    where: {
      messageId_userId_emoji: {
        messageId,
        userId: session.user.id,
        emoji,
      },
    },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({
      data: { messageId, userId: session.user.id, emoji },
    });
  }

  return true;
}

export async function getChannelMembers(channelId: string) {
  const session = await auth();
  if (!session?.user) return [];

  const members = await prisma.channelMember.findMany({
    where: { channelId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          nickname: true,
          avatar: true,
          stratum: true,
          role: true,
          lastActiveAt: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map((m) => ({
    ...m.user,
    isOnline:
      m.user.lastActiveAt &&
      new Date().getTime() - new Date(m.user.lastActiveAt).getTime() < 5 * 60 * 1000,
  }));
}

export async function getUnreadCounts() {
  const session = await auth();
  if (!session?.user) return {};

  const memberships = await prisma.channelMember.findMany({
    where: { userId: session.user.id },
    select: { channelId: true, lastReadAt: true },
  });

  const counts: Record<string, number> = {};

  for (const m of memberships) {
    const count = await prisma.message.count({
      where: {
        channelId: m.channelId,
        createdAt: { gt: m.lastReadAt },
        deletedAt: null,
        userId: { not: session.user.id },
      },
    });
    if (count > 0) counts[m.channelId] = count;
  }

  return counts;
}
