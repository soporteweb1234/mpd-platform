"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Copy, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createDepositIntent,
  refreshIntentStatus,
} from "@/lib/actions/payments";

type IntentView = {
  intentId: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  network: string;
  amountUsd: number;
  expiresAt: string | null;
};

type Status =
  | "WAITING"
  | "CONFIRMING"
  | "CONFIRMED"
  | "FINISHED"
  | "FAILED"
  | "REFUNDED"
  | "EXPIRED";

const STATUS_LABEL: Record<Status, string> = {
  WAITING: "Esperando pago",
  CONFIRMING: "Confirmando en red",
  CONFIRMED: "Confirmado — acreditando",
  FINISHED: "Acreditado",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  EXPIRED: "Expirado",
};

const STATUS_VARIANT: Record<
  Status,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  WAITING: "warning",
  CONFIRMING: "secondary",
  CONFIRMED: "secondary",
  FINISHED: "success",
  FAILED: "destructive",
  REFUNDED: "outline",
  EXPIRED: "outline",
};

export function DepositFlow() {
  const router = useRouter();
  const [amount, setAmount] = React.useState(50);
  const [network, setNetwork] = React.useState<"TRC20" | "BEP20" | "ERC20">("TRC20");
  const [pending, setPending] = React.useState(false);
  const [intent, setIntent] = React.useState<IntentView | null>(null);
  const [status, setStatus] = React.useState<Status>("WAITING");
  const [qrDataUrl, setQrDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    if (!intent?.payAddress) return;
    QRCode.toDataURL(intent.payAddress, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 240,
      color: { dark: "#0D1117", light: "#E6EDF3" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [intent?.payAddress]);

  React.useEffect(() => {
    if (!intent?.intentId) return;
    if (status === "FINISHED" || status === "FAILED" || status === "EXPIRED") return;

    const tick = async () => {
      const res = await refreshIntentStatus(intent.intentId);
      if (res.error) return;
      if (res.status) {
        setStatus(res.status);
        if (res.status === "FINISHED") {
          toast.success(`¡Depósito acreditado! +$${intent.amountUsd.toFixed(2)}`);
          setTimeout(() => router.push("/dashboard/balance"), 1800);
        }
      }
    };

    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [intent?.intentId, intent?.amountUsd, status, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    if (amount < 20 || amount > 10000) {
      toast.error("Importe entre $20 y $10000");
      return;
    }
    setPending(true);
    try {
      const res = await createDepositIntent({ amountUsd: amount, network });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setIntent({
        intentId: res.intentId,
        payAddress: res.payAddress,
        payAmount: res.payAmount,
        payCurrency: res.payCurrency,
        network,
        amountUsd: amount,
        expiresAt: res.expiresAt,
      });
      setStatus("WAITING");
    } finally {
      setPending(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copiado"),
      () => toast.error("No se pudo copiar"),
    );
  }

  if (intent) {
    return (
      <Card>
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <p className="text-xs text-mpd-gray uppercase tracking-wide">Estado</p>
              <Badge variant={STATUS_VARIANT[status]} className="mt-1">
                {status === "WAITING" || status === "CONFIRMING" ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : status === "FINISHED" ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : null}
                {STATUS_LABEL[status]}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-xs text-mpd-gray uppercase tracking-wide">Importe</p>
              <p className="text-lg font-mono text-mpd-white">
                ${intent.amountUsd.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR de la dirección de pago"
                width={240}
                height={240}
                className="rounded-lg border border-mpd-border"
              />
            ) : (
              <div className="h-[240px] w-[240px] rounded-lg border border-mpd-border bg-mpd-surface animate-pulse" />
            )}

            <p className="text-center text-xs text-mpd-amber max-w-sm">
              Envía <span className="font-mono text-mpd-gold">exactamente {intent.payAmount}</span>{" "}
              {intent.payCurrency.toUpperCase()} a la siguiente dirección (red{" "}
              <strong>{intent.network}</strong>)
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Dirección de pago</Label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={intent.payAddress}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copy(intent.payAddress)}
                aria-label="Copiar dirección"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Importe exacto a enviar</Label>
            <div className="flex items-center gap-2">
              <Input readOnly value={intent.payAmount} className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copy(intent.payAmount)}
                aria-label="Copiar importe"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-mpd-border bg-mpd-black/30 p-3 text-[11px] text-mpd-gray space-y-1">
            <p>• Los depósitos se acreditan automáticamente en unos minutos.</p>
            <p>• Si envías un importe distinto al indicado podría quedar en estado parcial.</p>
            <p>• Esta dirección es de un solo uso: no la reutilices.</p>
            {intent.expiresAt && (
              <p>
                • Expira:{" "}
                <span className="font-mono">
                  {new Date(intent.expiresAt).toLocaleString("es-ES")}
                </span>
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIntent(null);
                setStatus("WAITING");
                setQrDataUrl("");
              }}
            >
              Crear otro depósito
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs">Importe en USD *</Label>
            <Input
              type="number"
              min={20}
              max={10000}
              step={1}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
            <p className="text-[11px] text-mpd-gray">Mínimo $20 · Máximo $10000</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Red USDT *</Label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as "TRC20" | "BEP20" | "ERC20")}
              className="flex h-10 w-full rounded-lg border border-mpd-border bg-mpd-surface px-3 py-2 text-sm text-mpd-white focus:border-mpd-gold focus:outline-none"
            >
              <option value="TRC20">TRC20 (Tron) — recomendada, fee ~$1</option>
              <option value="BEP20">BEP20 (BNB Smart Chain) — fee ~$0.50</option>
              <option value="ERC20">ERC20 (Ethereum) — fee alto ~$15</option>
            </select>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Generando..." : "Generar dirección de depósito"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
