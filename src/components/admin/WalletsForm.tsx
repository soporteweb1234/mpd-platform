"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateWalletSettings } from "@/lib/actions/wallets";
import type { WalletSettings } from "@/lib/wallets/constants";

const NETWORKS: Array<{ key: keyof WalletSettings; label: string; help: string }> = [
  {
    key: "wallet.usdt.erc20",
    label: "USDT — ERC20 (Ethereum)",
    help: "Red Ethereum. Comisiones altas, ideal para importes grandes.",
  },
  {
    key: "wallet.usdt.trc20",
    label: "USDT — TRC20 (Tron)",
    help: "Red Tron. Comisiones muy bajas, estándar de la industria.",
  },
  {
    key: "wallet.usdt.bep20",
    label: "USDT — BEP20 (BNB Chain)",
    help: "Red BNB Chain (Binance Smart Chain).",
  },
];

export function WalletsForm({ initial }: { initial: WalletSettings }) {
  const [values, setValues] = useState<WalletSettings>(initial);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateWalletSettings(fd);
      if (res && "error" in res) {
        toast.error(res.error);
      } else {
        toast.success("Wallets actualizadas");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {NETWORKS.map((net) => (
        <Card key={net.key}>
          <CardHeader>
            <CardTitle className="text-base">{net.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor={net.key}>Dirección</Label>
            <Input
              id={net.key}
              name={net.key}
              value={values[net.key]}
              onChange={(e) => setValues({ ...values, [net.key]: e.target.value })}
              placeholder="0x... / T... / 0x..."
              autoComplete="off"
              spellCheck={false}
              className="font-mono text-xs"
            />
            <p className="text-xs text-mpd-gray">{net.help}</p>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar wallets"}
        </Button>
      </div>
    </form>
  );
}
