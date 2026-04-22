"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownToLine } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { WithdrawalModal } from "./WithdrawalModal";

type Props = {
  availableBalance: number;
};

export function BalanceAvailableCard({ availableBalance }: Props) {
  const [open, setOpen] = React.useState(false);
  const canWithdraw = availableBalance > 0;

  return (
    <>
      <Card
        onClick={() => canWithdraw && setOpen(true)}
        className={`border-mpd-green/30 group transition-colors ${
          canWithdraw
            ? "cursor-pointer hover:border-mpd-green/60 hover:bg-mpd-green/5"
            : "opacity-80"
        }`}
        role={canWithdraw ? "button" : undefined}
        tabIndex={canWithdraw ? 0 : undefined}
        onKeyDown={(e) => {
          if (canWithdraw && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        aria-label={canWithdraw ? "Abrir pasarela de retiro USDT" : undefined}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-1">
            <p className="text-xs text-mpd-gray uppercase tracking-wider">
              Saldo Disponible
            </p>
            {canWithdraw && (
              <span className="inline-flex items-center gap-1 text-[10px] text-mpd-green/80 group-hover:text-mpd-green">
                <ArrowDownToLine className="h-3 w-3" />
                Retirar
              </span>
            )}
          </div>
          <p className="text-3xl font-bold font-mono text-mpd-green">
            {formatUSD(availableBalance)}
          </p>
          {canWithdraw && (
            <p className="text-[10px] text-mpd-gray-dark mt-1">
              Clica para retirar en USDT
            </p>
          )}
        </CardContent>
      </Card>
      <WithdrawalModal
        open={open}
        onOpenChange={setOpen}
        availableBalance={availableBalance}
      />
    </>
  );
}
