import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discordChannelId, mpdChannelId } = await request.json();

  await prisma.channel.update({
    where: { id: mpdChannelId },
    data: { discordChannelId },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mpdChannelId } = await request.json();

  await prisma.channel.update({
    where: { id: mpdChannelId },
    data: { discordChannelId: null },
  });

  return NextResponse.json({ ok: true });
}
