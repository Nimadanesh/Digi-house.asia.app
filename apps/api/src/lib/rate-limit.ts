import type { Context, MiddlewareHandler } from "hono";

interface WindowEntry {
  timestamps: number[];
}

const stores = new Map<string, WindowEntry>();

const CLEANUP_MS = 60_000;
const cleanup = setInterval(() => {
  const cutoff = Date.now() - CLEANUP_MS;
  for (const [key, entry] of stores) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) stores.delete(key);
  }
}, CLEANUP_MS);
if (cleanup.unref) cleanup.unref();

export type KeyProvider = (c: Context) => string;

export function slidingWindowRateLimit(opts: {
  windowMs: number;
  max: number;
  key: KeyProvider;
}): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now();
    const k = opts.key(c);

    let entry = stores.get(k);
    if (!entry) {
      entry = { timestamps: [] };
      stores.set(k, entry);
    }

    entry.timestamps = entry.timestamps.filter(
      (t) => now - t < opts.windowMs,
    );

    if (entry.timestamps.length >= opts.max) {
      return c.json(
        { code: "rate_limit_exceeded", message: "Too many requests" },
        429,
      );
    }

    entry.timestamps.push(now);
    await next();
  };
}

export function ipKey(c: Context): string {
  return (
    c.req.header("x-forwarded-for") ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}
