import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const keys = searchParams.get("keys")?.split(",") ?? [];

  const settings = await prisma.systemSetting.findMany({
    where: keys.length > 0 ? { key: { in: keys } } : undefined,
  });

  const result: Record<string, string> = {};
  for (const s of settings) {
    // Never expose sensitive tokens
    if (s.key.includes("TOKEN") || s.key.includes("SECRET")) {
      result[s.key] = "••••••••";
    } else {
      result[s.key] = s.value;
    }
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { settings } = await request.json();

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: {
        key: s.key,
        value: s.value,
        category: s.category ?? "GENERAL",
        updatedBy: session.user.id,
      },
      update: {
        value: s.value,
        updatedBy: session.user.id,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
