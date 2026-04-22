import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DepositFlow } from "@/components/dashboard/DepositFlow";
import { requireSession } from "@/lib/auth/guards";

export const metadata = { title: "Depositar USDT — MPD" };
export const dynamic = "force-dynamic";

export default async function DepositPage() {
  await requireSession();

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/balance">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver al saldo
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-mpd-white">Depositar USDT</h1>
        <p className="text-sm text-mpd-gray">
          Carga saldo interno con USDT vía TRC20 (recomendado), BEP20 o ERC20.
          La red TRC20 es la más barata y rápida.
        </p>
      </div>

      <DepositFlow />
    </div>
  );
}
