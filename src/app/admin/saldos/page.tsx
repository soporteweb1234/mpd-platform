import { prisma } from "@/lib/prisma";
import { SaldosTable } from "@/components/admin/SaldosTable";

export const metadata = { title: "Saldos — Admin" };

export default async function AdminSaldosPage() {
  const rawUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      availableBalance: true,
      pendingBalance: true,
      totalRakeback: true,
      investedBalance: true,
    },
  });

  // Decimal → number en el límite RSC → Client (Prisma.Decimal no es serializable)
  const users = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    availableBalance: u.availableBalance.toNumber(),
    pendingBalance: u.pendingBalance.toNumber(),
    totalRakeback: u.totalRakeback.toNumber(),
    investedBalance: u.investedBalance.toNumber(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Gestión de Saldos</h1>
        <p className="text-sm text-mpd-gray mt-1">
          Edita los saldos de cualquier usuario. Los cambios se reflejan inmediatamente en su dashboard.
        </p>
      </div>

      <SaldosTable users={users} />
    </div>
  );
}
