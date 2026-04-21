import { Prisma } from "@prisma/client";

type DecimalLike = Prisma.Decimal | number | string | null | undefined;

export function toNum(v: DecimalLike): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return v.toNumber();
}

export function decimal(v: DecimalLike): Prisma.Decimal {
  if (v === null || v === undefined) return new Prisma.Decimal(0);
  if (v instanceof Prisma.Decimal) return v;
  return new Prisma.Decimal(v);
}

export function addMoney(a: DecimalLike, b: DecimalLike): Prisma.Decimal {
  return decimal(a).plus(decimal(b));
}

export function isNegative(v: DecimalLike): boolean {
  return decimal(v).isNegative();
}
