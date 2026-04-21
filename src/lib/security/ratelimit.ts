/**
 * Rate limiter con dos backends:
 *   1. Upstash Redis REST si UPSTASH_REDIS_REST_URL + TOKEN están presentes.
 *   2. In-memory Map con TTL por proceso (fallback dev / sin Upstash).
 *
 * Estrategia: sliding window aproximado (contador fijo por ventana de `windowMs`).
 * Suficiente para el blast-radius que queremos proteger (login, 2FA, mutaciones
 * admin), no pretendemos precisión de trading HFT.
 */

type LimitResult = {
  success: boolean;
  remaining: number;
  reset: number; // epoch ms
};

type Backend = {
  increment(key: string, windowMs: number, limit: number): Promise<LimitResult>;
};

// -----------------------------------------------------------------------------
// In-memory backend
// -----------------------------------------------------------------------------

type Bucket = { count: number; reset: number };
const memStore = new Map<string, Bucket>();

const memoryBackend: Backend = {
  async increment(key, windowMs, limit) {
    const now = Date.now();
    const entry = memStore.get(key);

    if (!entry || entry.reset <= now) {
      const reset = now + windowMs;
      memStore.set(key, { count: 1, reset });
      return { success: true, remaining: limit - 1, reset };
    }

    entry.count += 1;
    const success = entry.count <= limit;
    return {
      success,
      remaining: Math.max(0, limit - entry.count),
      reset: entry.reset,
    };
  },
};

// GC perezoso para no crecer indefinido.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memStore) {
    if (v.reset <= now) memStore.delete(k);
  }
}, 60_000).unref?.();

// -----------------------------------------------------------------------------
// Upstash Redis REST backend
// -----------------------------------------------------------------------------

function makeUpstashBackend(url: string, token: string): Backend {
  return {
    async increment(key, windowMs, limit) {
      const pipeline = [
        ["INCR", key],
        ["PEXPIRE", key, String(windowMs), "NX"],
        ["PTTL", key],
      ];
      try {
        const res = await fetch(`${url}/pipeline`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(pipeline),
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`upstash http ${res.status}`);
        const data = (await res.json()) as Array<{ result: number }>;
        const count = Number(data[0]?.result ?? 0);
        const ttl = Number(data[2]?.result ?? windowMs);
        const reset = Date.now() + (ttl > 0 ? ttl : windowMs);
        return {
          success: count <= limit,
          remaining: Math.max(0, limit - count),
          reset,
        };
      } catch {
        // Ante fallo de red, no bloqueamos al usuario — fail-open.
        return { success: true, remaining: limit, reset: Date.now() + windowMs };
      }
    },
  };
}

const backend: Backend = (() => {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return makeUpstashBackend(url, token);
  return memoryBackend;
})();

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export type RateLimitConfig = {
  /** Identificador único del limitador (ej "login"). */
  name: string;
  /** Ventana en milisegundos. */
  windowMs: number;
  /** Máximo de intentos por ventana. */
  limit: number;
};

export async function rateLimit(
  config: RateLimitConfig,
  identifier: string,
): Promise<LimitResult> {
  const key = `rl:${config.name}:${identifier}`;
  return backend.increment(key, config.windowMs, config.limit);
}

/** Presets usados en el repo para coherencia. */
export const RateLimits = {
  login: { name: "login", windowMs: 15 * 60_000, limit: 5 },
  twoFactorVerify: { name: "2fa-verify", windowMs: 5 * 60_000, limit: 5 },
  adminMoney: { name: "admin-money", windowMs: 60_000, limit: 30 },
} as const satisfies Record<string, RateLimitConfig>;

/** Extrae IP de Request / NextRequest headers de forma robusta. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}
