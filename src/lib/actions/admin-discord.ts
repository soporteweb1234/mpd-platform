"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { syncDiscordRole } from "@/lib/discord/roles";

export async function triggerDiscordReconcile(): Promise<{
  ok?: true;
  synced?: number;
  failed?: number;
  error?: string;
}> {
  const authz = await checkAdmin();
  if ("error" in authz) return { error: authz.error };
  const { session } = authz;

  const users = await prisma.user.findMany({
    where: {
      discordId: { not: null },
      discordConnected: true,
    },
    select: { id: true, discordId: true, stratum: true },
    take: 200,
  });

  let synced = 0;
  let failed = 0;
  for (const u of users) {
    if (!u.discordId) continue;
    const r = await syncDiscordRole({
      userId: u.id,
      discordId: u.discordId,
      toStratum: u.stratum,
      source: "manual",
    });
    if (r.success) synced++;
    else failed++;
    await new Promise((res) => setTimeout(res, 150));
  }

  await prisma.activityLog.create({
    data: {
      userId: session.user.id,
      action: "DISCORD_RECONCILE_TRIGGERED",
      entityType: "System",
      entityId: "discord",
      details: { synced, failed, total: users.length },
    },
  });

  revalidatePath("/admin/settings/discord");
  return { ok: true, synced, failed };
}

export async function syncSingleUserDiscord(
  userId: string,
): Promise<{ ok?: true; error?: string }> {
  const authz = await checkAdmin();
  if ("error" in authz) return { error: authz.error };

  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { discordId: true, discordConnected: true, stratum: true },
  });
  if (!u) return { error: "Usuario no encontrado" };
  if (!u.discordId || !u.discordConnected) {
    return { error: "Usuario sin Discord vinculado" };
  }

  const r = await syncDiscordRole({
    userId,
    discordId: u.discordId,
    toStratum: u.stratum,
    source: "manual",
  });

  revalidatePath(`/admin/users/${userId}`);
  return r.success ? { ok: true } : { error: r.error ?? "Fallo desconocido" };
}
