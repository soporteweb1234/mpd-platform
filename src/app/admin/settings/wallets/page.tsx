import { redirect } from "next/navigation";
import { requireAdmin, AuthzError } from "@/lib/auth/guards";
import { getWalletSettings } from "@/lib/actions/wallets";
import { WalletsForm } from "@/components/admin/WalletsForm";

export const metadata = { title: "Wallets USDT — Admin" };

export default async function WalletsSettingsPage() {
  try {
    await requireAdmin();
  } catch (err) {
    if (err instanceof AuthzError) redirect(err.status === 401 ? "/login" : "/dashboard");
    throw err;
  }

  const settings = await getWalletSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Wallets USDT</h1>
        <p className="text-sm text-mpd-gray mt-1">
          Direcciones administradas manualmente. Cada retiro lo revisa y paga un admin;
          el usuario verá estas direcciones como destino informativo cuando se conecte
          el flujo de retirada.
        </p>
      </div>

      <WalletsForm initial={settings} />
    </div>
  );
}
