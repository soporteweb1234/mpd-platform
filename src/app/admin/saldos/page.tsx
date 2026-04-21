import { prisma } from "@/lib/prisma";
import { SaldosTable } from "@/components/admin/SaldosTable";
import { toNum } from "@/lib/money";

export const metadata = { title: "Saldos — Admin" };

export default async function AdminSaldosPage() {
  const rows = await prisma.user.findMany({
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

  const users = rows.map((u) => ({
    ...u,
    availableBalance: toNum(u.availableBalance),
    pendingBalance: toNum(u.pendingBalance),
    totalRakeback: toNum(u.totalRakeback),
    investedBalance: toNum(u.investedBalance),
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
