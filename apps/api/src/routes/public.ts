import { Hono, type MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { TradeStore } from "../orders/trade-store.js";
import type { WaitlistStore } from "../waitlist/waitlist-store.js";

/**
 * A5/A6: unauthenticated public read endpoints for the marketing site
 * (fractionalluxe.com). No personal data, no orderbook depth, no writes.
 *
 * Unit contract: money fields are whole US dollars (site manifest convention),
 * NOT cents like the internal API. Logged as an A5 mapping decision.
 */
export type PublicRouteDeps = {
  properties: PropertyStore;
  trades?: TradeStore | null;
  /** Present → POST /public/waitlist is mounted (A6). */
  waitlist?: WaitlistStore | null;
  /** Comma-separated allowed origins; default site + local dev (A5 CORS). */
  corsOrigins?: string;
  rateLimiter?: MiddlewareHandler;
};

export type PublicProperty = {
  propertyId: string;
  title: string;
  destination: string;
  area: string;
  pricePerShare: number;
  sharesSold: number;
  totalShares: number;
  projectedNetYield: number | null;
};

export type PublicPropertyDetail = PublicProperty & {
  fundedPct: number;
  recentTrades: { price: number; qty: number; at: string }[];
};

const DEFAULT_CORS_ORIGINS =
  "https://fractionalluxe.com,http://localhost:3000";

/** location is stored as "{area}, {destination}" — split at the last comma. */
function splitLocation(location: string): { area: string; destination: string } {
  const idx = location.lastIndexOf(", ");
  if (idx <= 0) return { area: location, destination: location };
  return { area: location.slice(0, idx), destination: location.slice(idx + 2) };
}

function projectedNetYieldOf(p: {
  meta: { projectedNetYieldPct?: number };
  annualRentUsd: number;
  totalValueUsd: number;
}): number | null {
  if (typeof p.meta?.projectedNetYieldPct === "number") {
    return p.meta.projectedNetYieldPct;
  }
  if (p.totalValueUsd > 0) {
    // Fallback for legacy rows without manifest projections (both in cents).
    return Math.round((p.annualRentUsd / p.totalValueUsd) * 1000) / 10;
  }
  return null;
}

export function toPublicProperty(l: {
  id: string;
  title: string;
  location: string;
  sharePriceUsd: number;
  sharesSold: number;
  totalShares: number;
  annualRentUsd: number;
  totalValueUsd: number;
  meta: { projectedNetYieldPct?: number };
}): PublicProperty {
  const { area, destination } = splitLocation(l.location);
  return {
    propertyId: l.id,
    title: l.title,
    destination,
    area,
    pricePerShare: l.sharePriceUsd / 100,
    sharesSold: l.sharesSold,
    totalShares: l.totalShares,
    projectedNetYield: projectedNetYieldOf(l),
  };
}

export function createPublicRoutes(deps: PublicRouteDeps) {
  const app = new Hono();

  app.use(
    "/public/*",
    cors({
      origin: (deps.corsOrigins ?? DEFAULT_CORS_ORIGINS)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      allowMethods: ["GET", "POST", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  );
  if (deps.rateLimiter) {
    app.use("/public/*", deps.rateLimiter);
  }

  app.get("/public/properties", async (c) => {
    const listings = await deps.properties.list();
    return c.json(listings.map(toPublicProperty));
  });

  app.get("/public/properties/:id", async (c) => {
    const id = c.req.param("id");
    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }
    const recent = deps.trades
      ? await deps.trades.listByProperty(id, { limit: 5 })
      : [];
    const body: PublicPropertyDetail = {
      ...toPublicProperty(listing),
      fundedPct:
        listing.totalShares > 0
          ? Math.round((listing.sharesSold / listing.totalShares) * 1000) / 10
          : 0,
      recentTrades: recent.map((t) => ({
        price: t.priceUsd / 100,
        qty: t.quantity,
        at: t.createdAt.toISOString(),
      })),
    };
    return c.json(body);
  });

  // A6: waitlist signup — validated, idempotent on email, no notifications (U3).
  const waitlistStore = deps.waitlist ?? null;
  if (waitlistStore) {
    app.post("/public/waitlist", async (c) => {
      let raw: unknown;
      try {
        raw = await c.req.json();
      } catch {
        return c.json(
          { code: "validation_error", message: "Invalid JSON body" },
          400,
        );
      }
      const body = (raw ?? {}) as Record<string, unknown>;
      const email = typeof body.email === "string" ? body.email.trim() : "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json(
          { code: "validation_error", message: "Invalid email" },
          400,
        );
      }
      await waitlistStore.add({
        email,
        telegram: strOrNull(body.telegram),
        propertyId: strOrNull(body.propertyId),
        utm: strOrNull(body.utm),
      });
      return c.json({ ok: true });
    });
  }

  return app;
}

function strOrNull(v: unknown): string | null | undefined {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s === "" ? null : s.slice(0, 256);
}
