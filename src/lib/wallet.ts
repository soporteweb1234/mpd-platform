import { Prisma, type TransactionType } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export async function creditBalance(
  tx: Tx,
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  createdBy: string | null,
  referenceType?: string,
): Promise<{ balanceAfter: Prisma.Decimal }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("creditBalance requires a positive, finite amount");
  }

  const updated = await tx.user.update({
    where: { id: userId },
    data: { availableBalance: { increment: amount } },
    select: { availableBalance: true },
  });

  const balanceAfter = updated.availableBalance;
  const balanceBefore = balanceAfter.minus(amount);

  await tx.balanceTransaction.create({
    data: {
      userId,
      type,
      amount,
      balanceBefore: balanceBefore.toNumber(),
      balanceAfter: balanceAfter.toNumber(),
      description,
      referenceType,
      createdBy,
    },
  });

  return { balanceAfter };
}

export async function debitBalance(
  tx: Tx,
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
  createdBy: string | null,
): Promise<{ balanceAfter: Prisma.Decimal }> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("debitBalance requires a positive, finite amount");
  }

  let updated;
  try {
    updated = await tx.user.update({
      where: { id: userId, availableBalance: { gte: amount } },
      data: { availableBalance: { decrement: amount } },
      select: { availableBalance: true },
    });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new Error("Saldo insuficiente");
    }
    throw err;
  }

  const balanceAfter = updated.availableBalance;
  const balanceBefore = balanceAfter.plus(amount);

  await tx.balanceTransaction.create({
    data: {
      userId,
      type,
      amount: -amount,
      balanceBefore: balanceBefore.toNumber(),
      balanceAfter: balanceAfter.toNumber(),
      description,
      createdBy,
    },
  });

  return { balanceAfter };
}
