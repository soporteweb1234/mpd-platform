"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { debitBalance } from "@/lib/wallet";

export async function purchaseService(userId: string, serviceId: string) {
  const session = await auth();
  if (!session?.user || session.user.id !== userId) {
    return { error: "No autorizado" };
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      priceInBalance: true,
      status: true,
    },
  });

  if (!service) return { error: "Servicio no encontrado" };
  if (service.status !== "AVAILABLE") return { error: "Servicio no disponible" };
  if (service.priceInBalance == null) {
    return { error: "Este servicio no puede pagarse con saldo interno" };
  }

  const price = service.priceInBalance;

  try {
    const order = await prisma.$transaction(async (tx) => {
      await debitBalance(
        tx,
        userId,
        price,
        "SERVICE_PURCHASE",
        `Compra: ${service.name}`,
        userId,
      );

      return tx.serviceOrder.create({
        data: {
          userId,
          serviceId: service.id,
          amount: price,
          paidWithBalance: true,
          status: "CONFIRMED",
        },
        select: { id: true },
      });
    });

    return { success: true as const, orderId: order.id };
  } catch (err) {
    if (err instanceof Error && err.message === "Saldo insuficiente") {
      return { error: "Saldo insuficiente" };
    }
    throw err;
  }
}
