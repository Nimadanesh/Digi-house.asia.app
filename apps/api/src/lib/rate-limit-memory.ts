import type { MiddlewareHandler } from "hono";

/**
 * A5: simple in-memory fixed-window-ish token bucket for unauthenticated
 * /public routes. Per-IP (x-forwarded-for aware). Single-process only —
 * swap for the Redis bucket if the API ever scales horizontally.
 */
export function createMemoryTokenBucket(opts: {
  max: number;
  windowMs: number;
}): MiddlewareHandler {
  const buckets = new Map<string, { tokens: number; last: number }>();
  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
      c.req.header("x-real-ip") ??
      "local";
    const now = Date.now();
    const b = buckets.get(ip) ?? { tokens: opts.max, last: now };
    const refill = ((now - b.last) / opts.windowMs) * opts.max;
    b.tokens = Math.min(opts.max, b.tokens + refill);
    b.last = now;
    if (b.tokens < 1) {
      buckets.set(ip, b);
      return c.json(
        { code: "rate_limited", message: "Too many requests" },
        429,
      );
    }
    b.tokens -= 1;
    buckets.set(ip, b);
    await next();
  };
}
