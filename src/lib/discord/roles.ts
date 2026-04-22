import { prisma } from "@/lib/prisma";
import type { PlayerStratum } from "@prisma/client";

const DISCORD_API = "https://discord.com/api/v10";

const STRATUM_ROLE_ENV: Record<PlayerStratum, string> = {
  NOVATO: "DISCORD_ROLE_NOVATO",
  SEMI_PRO: "DISCORD_ROLE_SEMIPRO",
  PROFESIONAL: "DISCORD_ROLE_PROFESIONAL",
  REFERENTE: "DISCORD_ROLE_REFERENTE",
};

export function getRoleIdForStratum(stratum: PlayerStratum): string | null {
  const envKey = STRATUM_ROLE_ENV[stratum];
  const val = process.env[envKey];
  return val && val.trim() ? val.trim() : null;
}

export function getAllStratumRoleIds(): string[] {
  return (Object.keys(STRATUM_ROLE_ENV) as PlayerStratum[])
    .map(getRoleIdForStratum)
    .filter((id): id is string => Boolean(id));
}

export type SyncOutcome = { success: boolean; error?: string };

export type SyncInput = {
  userId: string;
  discordId: string;
  fromStratum?: PlayerStratum | null;
  toStratum: PlayerStratum;
  source: "stratum_change" | "cron_reconcile" | "manual";
};

async function discordFetch(
  method: "PUT" | "DELETE",
  path: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) return { ok: false, status: 0, text: "DISCORD_BOT_TOKEN missing" };

  const res = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text().catch(() => "");
  return { ok: res.ok, status: res.status, text };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function syncDiscordRole(input: SyncInput): Promise<SyncOutcome> {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  if (!guildId) {
    return logAndReturn(input, null, null, {
      success: false,
      error: "DISCORD_GUILD_ID missing",
    });
  }

  const targetRoleId = getRoleIdForStratum(input.toStratum);
  if (!targetRoleId) {
    return logAndReturn(input, null, null, {
      success: false,
      error: `env missing for stratum ${input.toStratum}`,
    });
  }

  const allRoleIds = getAllStratumRoleIds();
  const rolesToRemove = allRoleIds.filter((id) => id !== targetRoleId);

  let removedRoleId: string | null = null;
  for (const roleId of rolesToRemove) {
    const r = await discordFetch(
      "DELETE",
      `/guilds/${guildId}/members/${input.discordId}/roles/${roleId}`,
    );
    if (r.ok) {
      removedRoleId = roleId;
    } else if (r.status === 404) {
      // user not in guild or didn't have the role — not fatal
      continue;
    } else if (r.status === 429) {
      await sleep(500);
    }
    // small spacer to respect rate limits
    await sleep(120);
  }

  const put = await discordFetch(
    "PUT",
    `/guilds/${guildId}/members/${input.discordId}/roles/${targetRoleId}`,
  );

  if (!put.ok) {
    return logAndReturn(input, null, removedRoleId, {
      success: false,
      error: `PUT ${put.status}: ${put.text.slice(0, 200)}`,
    });
  }

  return logAndReturn(input, targetRoleId, removedRoleId, { success: true });
}

async function logAndReturn(
  input: SyncInput,
  addedRoleId: string | null,
  removedRoleId: string | null,
  outcome: SyncOutcome,
): Promise<SyncOutcome> {
  try {
    await prisma.discordRoleSyncLog.create({
      data: {
        userId: input.userId,
        discordId: input.discordId,
        fromStratum: input.fromStratum ?? null,
        toStratum: input.toStratum,
        addedRoleId,
        removedRoleId,
        source: input.source,
        success: outcome.success,
        error: outcome.error ?? null,
      },
    });
  } catch {
    // swallow — logging must not break the flow
  }
  return outcome;
}
