import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryTradeStore } from "../orders/trade-store.js";
import { createMemoryWaitlistStore } from "../waitlist/waitlist-store.js";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  debug: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

function testEnv(): ApiEnv {
  return {
    NODE_ENV: "test",
    PORT: 8787,
    LOG_LEVEL: "silent",
    SETTLEMENT_MODE: undefined,
    DATABASE_URL: undefined,
    TELEGRAM_BOT_TOKEN: "",
    SESSION_SECRET: "test-session-secret-at-least-32-chars",
    SESSION_TTL_SECONDS: 3600,
    CORS_ORIGIN: "http://localhost:3000",
    PUBLIC_CORS_ORIGINS:
      "https://fractionalluxe.com,http://localhost:3000",
    TON_RELAY_ADDRESS: undefined,
    BUY_STUB_NANOTON: "10000000",
    BUY_INTENT_TTL_SECONDS: 900,
    AUTH_RATE_LIMIT_MAX: 10,
    ADMIN_TON_WALLET_ADDRESS: undefined,
    ADMIN_USDT_WALLET_ADDRESS: undefined,
    USDT_JETTON_MASTER_ADDRESS: undefined,
    TON_USD_PRICE_CENTS: 200,
    REDIS_URL: undefined,
    ORDER_RATE_LIMIT_MAX: 30,
    ORDER_RATE_LIMIT_WINDOW_MS: 60000,
    PAYOUT_TICK_MS: 60000,
    PAYOUT_WORKER_ENABLED: false,
    ALLOW_MANUAL_PAYOUT_TICK: false,
    PAYOUT_TICK_SECRET: undefined,
    NOTIFY_EARNINGS_PAID: false,
    TON_API_URL: "https://testnet.tonapi.io",
    TON_API_KEY: undefined,
    INDEXER_POLL_MS: 10_000,
    INDEXER_ENABLED: false,
    ADMIN_API_SECRET: undefined,
    R2_ACCOUNT_ID: undefined,
    R2_ACCESS_KEY_ID: undefined,
    R2_SECRET_ACCESS_KEY: undefined,
    R2_BUCKET: undefined,
    R2_PUBLIC_BASE_URL: undefined,
    LAUNCH_MODE: "open",
    ALLOWLIST_WALLETS: undefined,
    YIELD_WORKER_ENABLED: false,
    YIELD_TICK_MS: 60_000,
    UNLOCK_MATURATION_MS: 3 * 24 * 3_600_000,
    NOTIFY_YIELD: false,
    HOUSE_ACCOUNT_USER_ID: "house-account",
    OPS_CHAT_ID: undefined,
  };
}

function makeApp() {
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  const trades = createMemoryTradeStore();
  const waitlist = createMemoryWaitlistStore();
  const app = createApp({
    env: testEnv(),
    log: silentLog,
    properties,
    trades,
    waitlist,
  });
  return { app, trades, waitlist };
}

describe("GET /public/properties (A5)", () => {
  it("returns listings with the site contract shape and dollar prices", async () => {
    const { app } = makeApp();
    const res = await app.request("/public/properties");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<Record<string, unknown>>;
    expect(body.length).toBeGreaterThanOrEqual(6);
    for (const p of body) {
      expect(Object.keys(p).sort()).toEqual(
        [
          "area",
          "destination",
          "pricePerShare",
          "projectedNetYield",
          "propertyId",
          "sharesSold",
          "title",
          "totalShares",
        ].sort(),
      );
      // No personal data leaks.
      expect(JSON.stringify(p)).not.toContain("ownerWallet");
    }
    // Money is whole dollars (site manifest convention), not cents.
    const marina = body.find((p) => p.propertyId === "prop-marina-vista-4b")!;
    expect(marina.pricePerShare).toBe(80);
    expect(marina.destination).toBe("UAE");
    expect(marina.area).toBe("Dubai Marina");
  });

  it("exposes CORS headers for allowed origins only", async () => {
    const { app } = makeApp();
    const ok = await app.request("/public/properties", {
      headers: { origin: "https://fractionalluxe.com" },
    });
    expect(ok.headers.get("access-control-allow-origin")).toBe(
      "https://fractionalluxe.com",
    );
    const denied = await app.request("/public/properties", {
      headers: { origin: "https://evil.example" },
    });
    expect(denied.headers.get("access-control-allow-origin")).toBeNull();
  });
});

describe("GET /public/properties/:id (A5)", () => {
  it("returns detail with fundedPct and recentTrades", async () => {
    const { app, trades } = makeApp();
    await trades.insert({
      id: "tr-1",
      propertyId: "prop-marina-vista-4b",
      priceUsd: 8000,
      quantity: 3,
      buyerUserId: "u1",
      sellerUserId: "house-account",
      buyFeeUsd: 0,
      sellFeeUsd: 0,
      makerOrderId: "o1",
      takerOrderId: "o2",
      fillSeq: 1,
    });
    const res = await app.request("/public/properties/prop-marina-vista-4b");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.fundedPct).toBeCloseTo(92, 1);
    expect(Array.isArray(body.recentTrades)).toBe(true);
    expect((body.recentTrades as unknown[]).length).toBe(1);
    const t = (body.recentTrades as Array<Record<string, unknown>>)[0]!;
    expect(t.price).toBe(80); // dollars
    expect(t.qty).toBe(3);
    expect(typeof t.at).toBe("string");
  });

  it("404s for an unknown property", async () => {
    const { app } = makeApp();
    const res = await app.request("/public/properties/nope");
    expect(res.status).toBe(404);
  });

  it("rate limits unauthenticated reads (429)", async () => {
    const { app } = makeApp();
    let last = 0;
    for (let i = 0; i < 130; i++) {
      last = (await app.request("/public/properties")).status;
      if (last === 429) break;
    }
    expect(last).toBe(429);
  });
});

describe("POST /public/waitlist (A6)", () => {
  it("accepts a valid email and returns { ok: true }", async () => {
    const { app, waitlist } = makeApp();
    const res = await app.request("/public/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        propertyId: "bali-villa-canggu-001",
        utm: "ig-bio",
      }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(waitlist._rows).toHaveLength(1);
    expect(waitlist._rows[0]).toMatchObject({
      email: "user@example.com",
      propertyId: "bali-villa-canggu-001",
      utm: "ig-bio",
    });
  });

  it("is idempotent on email (second POST does not duplicate)", async () => {
    const { app, waitlist } = makeApp();
    const body = JSON.stringify({ email: "user@example.com" });
    for (let i = 0; i < 2; i++) {
      const res = await app.request("/public/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    }
    expect(waitlist._rows).toHaveLength(1);
  });

  it("rejects invalid emails and malformed bodies", async () => {
    const { app, waitlist } = makeApp();
    const bad = await app.request("/public/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(bad.status).toBe(400);
    const empty = await app.request("/public/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(empty.status).toBe(400);
    const noJson = await app.request("/public/waitlist", { method: "POST" });
    expect(noJson.status).toBe(400);
    expect(waitlist._rows).toHaveLength(0);
  });

  it("exposes CORS headers for allowed origins", async () => {
    const { app } = makeApp();
    const res = await app.request("/public/waitlist", {
      method: "POST",
      headers: {
        origin: "https://fractionalluxe.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ email: "cors@example.com" }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe(
      "https://fractionalluxe.com",
    );
  });
});
