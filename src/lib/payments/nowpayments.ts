import crypto from "node:crypto";

const API_URL = process.env.NOWPAYMENTS_API_URL ?? "https://api.nowpayments.io/v1";
const API_KEY = process.env.NOWPAYMENTS_API_KEY ?? "";
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET ?? "";

export const NETWORK_TO_CURRENCY: Record<string, string> = {
  TRC20: "usdttrc20",
  BEP20: "usdtbsc",
  ERC20: "usdterc20",
};

export type NowPaymentsStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "refunded"
  | "expired";

export type CreateInvoiceInput = {
  userId: string;
  intentId: string;
  amountUsd: number;
  network: "TRC20" | "BEP20" | "ERC20";
  ipnCallbackUrl: string;
};

export type CreateInvoiceResult = {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  expiresAt: Date | null;
};

function requireKeys() {
  if (!API_KEY) throw new Error("NOWPAYMENTS_API_KEY no configurada");
}

function authHeaders(): HeadersInit {
  return {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  };
}

export async function createInvoice(
  input: CreateInvoiceInput,
): Promise<CreateInvoiceResult> {
  requireKeys();
  const payCurrency = NETWORK_TO_CURRENCY[input.network];
  if (!payCurrency) throw new Error(`Red no soportada: ${input.network}`);

  const res = await fetch(`${API_URL}/payment`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      price_amount: input.amountUsd,
      price_currency: "usd",
      pay_currency: payCurrency,
      order_id: input.intentId,
      order_description: `MPD deposit ${input.intentId}`,
      ipn_callback_url: input.ipnCallbackUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NOWPayments createInvoice ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    payment_id: string | number;
    pay_address: string;
    pay_amount: number;
    pay_currency: string;
    expiration_estimate_date?: string;
  };

  return {
    paymentId: String(data.payment_id),
    payAddress: data.pay_address,
    payAmount: data.pay_amount,
    payCurrency: data.pay_currency,
    expiresAt: data.expiration_estimate_date
      ? new Date(data.expiration_estimate_date)
      : null,
  };
}

export type PaymentStatusResult = {
  status: NowPaymentsStatus;
  payAmount: number | null;
  actualPaidAmount: number | null;
  txHash: string | null;
};

export async function getPaymentStatus(
  paymentId: string,
): Promise<PaymentStatusResult> {
  requireKeys();
  const res = await fetch(`${API_URL}/payment/${paymentId}`, {
    method: "GET",
    headers: { "x-api-key": API_KEY },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`NOWPayments getStatus ${res.status}: ${text.slice(0, 300)}`);
  }
  const data = (await res.json()) as {
    payment_status: NowPaymentsStatus;
    pay_amount?: number;
    actually_paid?: number;
    payin_hash?: string;
    outcome_amount?: number;
  };
  return {
    status: data.payment_status,
    payAmount: data.pay_amount ?? null,
    actualPaidAmount: data.actually_paid ?? null,
    txHash: data.payin_hash ?? null,
  };
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    );
    const out: Record<string, unknown> = {};
    for (const [k, v] of entries) out[k] = sortObject(v);
    return out;
  }
  return value;
}

export function verifyIpnSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!IPN_SECRET || !signatureHeader) return false;
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const sorted = sortObject(parsed);
  const payload = JSON.stringify(sorted);
  const expected = crypto
    .createHmac("sha512", IPN_SECRET)
    .update(payload)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function mapNowPaymentsStatus(
  s: NowPaymentsStatus,
): "WAITING" | "CONFIRMING" | "CONFIRMED" | "FINISHED" | "FAILED" | "REFUNDED" | "EXPIRED" {
  switch (s) {
    case "waiting":
      return "WAITING";
    case "confirming":
    case "sending":
    case "partially_paid":
      return "CONFIRMING";
    case "confirmed":
      return "CONFIRMED";
    case "finished":
      return "FINISHED";
    case "failed":
      return "FAILED";
    case "refunded":
      return "REFUNDED";
    case "expired":
      return "EXPIRED";
  }
}
