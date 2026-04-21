"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkAdmin } from "@/lib/auth/guards";
import { WALLET_KEYS, type WalletKey, type WalletSettings } from "@/lib/wallets/constants";

export async function getWalletSettings(): Promise<WalletSettings> {
  const rows = await prisma.systemSetting.findMany({
    where: { key: { in: [...WALLET_KEYS] } },
    select: { key: true, value: true },
  });
  const map: WalletSettings = {
    "wallet.usdt.erc20": "",
    "wallet.usdt.trc20": "",
    "wallet.usdt.bep20": "",
  };
  for (const row of rows) {
    if ((WALLET_KEYS as readonly string[]).includes(row.key)) {
      map[row.key as WalletKey] = row.value;
    }
  }
  return map;
}

export async function updateWalletSettings(formData: FormData) {
  const authz = await checkAdmin();
  if ("error" in authz) return authz;
  const { session } = authz;

  const payload: Partial<WalletSettings> = {};
  for (const key of WALLET_KEYS) {
    const raw = (formData.get(key) as string | null)?.trim() ?? "";
    payload[key] = raw;
  }

  const current = await getWalletSettings();
  const diff: Record<string, { before: string; after: string }> = {};
  for (const key of WALLET_KEYS) {
    const after = payload[key] ?? "";
    if (after !== current[key]) {
      diff[key] = { before: current[key], after };
    }
  }

  await prisma.$transaction([
    ...WALLET_KEYS.map((key) =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: payload[key] ?? "", updatedBy: session.user.id },
        create: {
          key,
          value: payload[key] ?? "",
          category: "WALLETS",
          description: `Wallet USDT ${key.split(".").at(-1)?.toUpperCase() ?? key}`,
          updatedBy: session.user.id,
        },
      }),
    ),
    prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "WALLETS_UPDATED",
        entityType: "system_setting",
        details: { diff },
      },
    }),
  ]);

  revalidatePath("/admin/settings/wallets");
  return { success: true };
}
