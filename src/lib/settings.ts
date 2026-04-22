import { prisma } from "@/lib/prisma";

export const SETTING_KEYS = {
  SERVICES_SHOW_PRICES: "services.showPrices",
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getBooleanSetting(
  key: SettingKey,
  defaultValue: boolean,
): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  if (!row) return defaultValue;
  return row.value === "true" || row.value === "1";
}
