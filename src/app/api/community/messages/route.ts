import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const channelId = req.nextUrl.searchParams.get("channelId");
  if (!channelId) {
    return NextResponse.json({ error: "channelId requerido" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { channelId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    take: 100,
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
          user: { select: { name: true } },
          discordAuthorName: true,
        },
      },
      reactions: {
        select: { emoji: true, userId: true },
      },
    },
  });

  // Update lastReadAt for this user in this channel
  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId: session.user.id } },
    update: { lastReadAt: new Date() },
    create: { channelId, userId: session.user.id, lastReadAt: new Date() },
  });

  // Group reactions
  const formattedMessages = messages.map((msg) => {
    const reactionMap = new Map<string, { count: number; hasReacted: boolean }>();
    for (const r of msg.reactions) {
      const existing = reactionMap.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.userId === session.user.id) existing.hasReacted = true;
      } else {
        reactionMap.set(r.emoji, {
          count: 1,
          hasReacted: r.userId === session.user.id,
        });
      }
    }

    return {
      id: msg.id,
      content: msg.content,
      type: msg.type,
      isPinned: msg.isPinned,
      isEdited: msg.isEdited,
      createdAt: msg.createdAt.toISOString(),
      source: msg.source,
      user: msg.user,
      discordAuthorName: msg.discordAuthorName,
      discordAuthorAvatar: msg.discordAuthorAvatar,
      replyTo: msg.replyTo,
      reactions: Array.from(reactionMap.entries()).map(([emoji, data]) => ({
        emoji,
        ...data,
      })),
    };
  });

  return NextResponse.json({ messages: formattedMessages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { channelId, content, replyToId } = await req.json();

  if (!channelId || !content?.trim()) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // Verify channel exists and user has access
  const channel = await prisma.channel.findUnique({ where: { id: channelId } });
  if (!channel) {
    return NextResponse.json({ error: "Canal no encontrado" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      channelId,
      userId: session.user.id,
      content: content.trim(),
      replyToId: replyToId || null,
      source: "WEB",
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
          user: { select: { name: true } },
          discordAuthorName: true,
        },
      },
    },
  });

  // Ensure user is a channel member
  await prisma.channelMember.upsert({
    where: { channelId_userId: { channelId, userId: session.user.id } },
    update: { lastReadAt: new Date() },
    create: { channelId, userId: session.user.id, lastReadAt: new Date() },
  });

  return NextResponse.json({
    message: {
      ...message,
      createdAt: message.createdAt.toISOString(),
      discordAuthorName: null,
      discordAuthorAvatar: null,
      reactions: [],
    },
  });
}
