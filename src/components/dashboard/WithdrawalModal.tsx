"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { formatUSD } from "@/lib/utils";
import { createWithdrawalRequest } from "@/lib/actions/withdrawals";
import {
  WITHDRAWAL_NETWORKS,
  WITHDRAWAL_FEES,
  WITHDRAWAL_MIN_USD,
  NETWORK_LABELS,
  type WithdrawalNetwork,
} from "@/lib/wallets/constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
};

export function WithdrawalModal({ open, onOpenChange, availableBalance }: Props) {
  const [network, setNetwork] = React.useState<WithdrawalNetwork>("TRC20");
  const [toAddress, setToAddress] = React.useState("");
  const [amountStr, setAmountStr] = React.useState("");
  const [pending, start] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setToAddress("");
      setAmountStr("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const amount = Number(amountStr);
  const amountValid = Number.isFinite(amount) && amount > 0;
  const fee = WITHDRAWAL_FEES[network];
  const netReceive = amountValid ? Math.max(0, amount - fee) : 0;

  const canSubmit =
    amountValid &&
    amount >= WITHDRAWAL_MIN_USD &&
    amount <= availableBalance &&
    amount > fee &&
    toAddress.trim().length >= 20 &&
    !pending;

  const onSubmit = () => {
    setError(null);
    start(async () => {
      const res = await createWithdrawalRequest({
        network,
        toAddress: toAddress.trim(),
        amountUsd: amount,
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-mpd-border bg-mpd-surface p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="text-lg font-semibold text-mpd-white">
                Retirar saldo en USDT
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-mpd-gray">
                Saldo disponible:{" "}
                <span className="font-mono text-mpd-green">
                  {formatUSD(availableBalance)}
                </span>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="text-mpd-gray hover:text-mpd-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          {success ? (
            <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-mpd-green" />
              <p className="text-mpd-white font-medium">Solicitud enviada</p>
              <p className="text-sm text-mpd-gray max-w-sm">
                Procesaremos tu retiro en un plazo máximo de 48 h laborables.
                Puedes consultar su estado en el historial más abajo.
              </p>
              <Button onClick={() => onOpenChange(false)} className="mt-2">
                Cerrar
              </Button>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {/* Red */}
              <div className="space-y-1.5">
                <Label>Red USDT</Label>
                <div className="grid grid-cols-3 gap-2">
                  {WITHDRAWAL_NETWORKS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNetwork(n)}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        network === n
                          ? "border-mpd-gold bg-mpd-gold/10 text-mpd-gold"
                          : "border-mpd-border bg-mpd-black/30 text-mpd-gray hover:text-mpd-white"
                      }`}
                    >
                      <div>{n}</div>
                      <div className="text-[10px] text-mpd-gray-dark mt-0.5 font-normal">
                        Fee {formatUSD(WITHDRAWAL_FEES[n])}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-mpd-gray-dark">
                  {NETWORK_LABELS[network]}
                </p>
              </div>

              {/* Dirección */}
              <div className="space-y-1.5">
                <Label htmlFor="toAddress">Dirección USDT de envío</Label>
                <Input
                  id="toAddress"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="Tu dirección de wallet"
                  maxLength={120}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-mpd-gray-dark">
                  Verifica dos veces la dirección. Un envío a una red incorrecta
                  puede ser irrecuperable.
                </p>
              </div>

              {/* Cantidad */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="amount">Cantidad a retirar (USDT)</Label>
                  <button
                    type="button"
                    onClick={() => setAmountStr(availableBalance.toFixed(2))}
                    className="text-[11px] text-mpd-gold hover:underline"
                  >
                    Máx.
                  </button>
                </div>
                <Input
                  id="amount"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={WITHDRAWAL_MIN_USD}
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder={`Mínimo ${WITHDRAWAL_MIN_USD}`}
                  className="font-mono"
                />
                <p className="text-[11px] text-mpd-gray-dark">
                  Mínimo {formatUSD(WITHDRAWAL_MIN_USD)}. Comisión{" "}
                  {formatUSD(fee)}.
                </p>
              </div>

              {/* Resumen */}
              <div className="rounded-lg border border-mpd-border bg-mpd-black/40 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-mpd-gray">Cantidad solicitada</span>
                  <span className="font-mono text-mpd-white">
                    {formatUSD(amountValid ? amount : 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mpd-gray">Comisión {network}</span>
                  <span className="font-mono text-mpd-amber">
                    −{formatUSD(fee)}
                  </span>
                </div>
                <div className="h-px bg-mpd-border" />
                <div className="flex justify-between">
                  <span className="text-mpd-white font-medium">
                    Recibirás aprox.
                  </span>
                  <span className="font-mono text-mpd-green font-semibold">
                    {formatUSD(netReceive)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-mpd-red/30 bg-mpd-red/5 p-2.5 text-xs text-mpd-red">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={pending}
                >
                  Cancelar
                </Button>
                <Button onClick={onSubmit} disabled={!canSubmit}>
                  {pending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    "Solicitar retiro"
                  )}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
