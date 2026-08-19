import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import type { OrderBookStatePublic } from "../orders/build-order-book.js";
import type { OrderPublic } from "../orders/map-order.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import {
  createMemoryHoldingStore,
  type HoldingRowInput,
} from "../portfolio/holding-store.js";
import type { PortfolioSummaryPublic } from "../portfolio/map-portfolio.js";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  debug: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

const SESSION = {
  secret: "test-session-secret-at-least-32-chars",
  ttlSeconds: 3600,
};

const PROP = "prop-alfama-terrace-flat";

function testEnv(): ApiEnv {
  return {
    NODE_ENV: "test",
    PORT: 8787,
    LOG_LEVEL: "silent",
    SETTLEMENT_MODE: undefined,
    DATABASE_URL: undefined,
    TELEGRAM_BOT_TOKEN: "",
    SESSION_SECRET: SESSION.secret,
    SESSION_TTL_SECONDS: SESSION.ttlSeconds,
    CORS_ORIGIN: "http://localhost:3000",
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

function seedUser(id: string, displayName: string, walletAddress: string | null = null) {
  return {
    id,
    displayName,
    username: null,
    photoUrl: null,
    role: "investor" as const,
    walletAddress,
    onboarded: false,
    useTelegramTheme: false,
    referredByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeApp(opts: {
  holdings?: HoldingRowInput[];
  extraUsers?: Array<{ id: string; name: string; wallet?: string }>;
} = {}) {
  const users = createMemoryUserStore([
    seedUser("user-a", "Alice", "EQAliceWallet"),
    seedUser("user-b", "Bob", "EQBobWallet"),
    ...(opts.extraUsers ?? []).map((u) =>
      seedUser(u.id, u.name, u.wallet),
    ),
  ]);
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  const holdings = createMemoryHoldingStore(
    opts.holdings ?? [
      {
        userId: "user-a",
        propertyId: PROP,
        sharesOwned: 200,
        avgCostUsd: 10_000,
        updatedAt: new Date(),
      },
    ],
  );
  const orders = createMemoryOrderStore();
  const audit = createMemoryAuditStore();
  const app = createApp({
    env: testEnv(),
    log: silentLog,
    users,
    properties,
    holdings,
    orders,
    audit,
  });
  return { app, orders, audit };
}

describe("GET /v1/properties/:id/order-book", () => {
  it("returns 404 for unknown property", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/properties/nope-zz/order-book");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("not_found");
  });

  it("returns empty book for known property", async () => {
    const { app } = makeApp();
    const res = await app.request(`/v1/properties/${PROP}/order-book`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as OrderBookStatePublic;
    expect(body.propertyId).toBe(PROP);
    expect(body.bids).toEqual([]);
    expect(body.asks).toEqual([]);
  });
});

describe("POST /v1/orders + DELETE + book", () => {
  it("places buy as user A → 201", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 10_500,
        quantity: 10,
      }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as OrderPublic;
    expect(body.status).toBe("open");
    expect(body.filledQuantity).toBe(0);
    expect(body.side).toBe("buy");
    expect(body.priceUsd).toBe(10_500);
    expect(body.quantity).toBe(10);
    expect(body.propertyId).toBe(PROP);
    expect(body.makerAddress).toBe("EQAliceWallet");
    expect(Number.isInteger(body.priceUsd)).toBe(true);
    expect(Number.isInteger(body.quantity)).toBe(true);
  });

  it("order-book shows aggregated level after place", async () => {
    const { app } = makeApp();
    await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 10_000,
        quantity: 5,
      }),
    });
    await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 10_000,
        quantity: 3,
      }),
    });
    const res = await app.request(`/v1/properties/${PROP}/order-book`);
    const body = (await res.json()) as OrderBookStatePublic;
    expect(body.bids).toEqual([
      { priceUsd: 10_000, quantity: 8, cumulative: 8 },
    ]);
    expect(body.bestBidUsd).toBe(10_000);
  });

  it("place without auth → 401", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 100,
        quantity: 1,
      }),
    });
    expect(res.status).toBe(401);
  });

  it("place invalid side/price/qty → 400", async () => {
    const { app } = makeApp();
    const auth = await bearerFor("user-a");
    const bad = [
      { propertyId: PROP, side: "hold", priceUsd: 100, quantity: 1 },
      { propertyId: PROP, side: "buy", priceUsd: 0, quantity: 1 },
      { propertyId: PROP, side: "buy", priceUsd: 1.5, quantity: 1 },
      { propertyId: PROP, side: "buy", priceUsd: 100, quantity: 0 },
    ];
    for (const body of bad) {
      const res = await app.request("/v1/orders", {
        method: "POST",
        headers: {
          Authorization: auth,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(400);
      const j = (await res.json()) as { code: string };
      expect(j.code).toBe("validation_error");
    }
  });

  it("user B cannot cancel user A order (IDOR → 403)", async () => {
    const { app, audit } = makeApp();
    const place = await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 10_000,
        quantity: 2,
      }),
    });
    const { id } = (await place.json()) as OrderPublic;

    const res = await app.request(`/v1/orders/${id}`, {
      method: "DELETE",
      headers: { Authorization: await bearerFor("user-b") },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("forbidden");
    // order.create audited; the forbidden cancel itself writes nothing
    const audits = await audit.listByResource("order", id);
    expect(audits).toHaveLength(1);
    expect(audits[0]!.action).toBe("order.create");
  });

  it("user A cancel own → 204; book clears; second cancel → 409", async () => {
    const { app, audit } = makeApp();
    const place = await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 9_000,
        quantity: 4,
      }),
    });
    const { id } = (await place.json()) as OrderPublic;

    const del = await app.request(`/v1/orders/${id}`, {
      method: "DELETE",
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(del.status).toBe(204);
    const cancelAudits = await audit.listByResource("order", id);
    expect(cancelAudits).toHaveLength(2);
    // audit list is newest-first
    expect(cancelAudits.map((a) => a.action)).toEqual([
      "order.cancel",
      "order.create",
    ]);
    expect(cancelAudits[0]!.actorUserId).toBe("user-a");

    const book = (await (
      await app.request(`/v1/properties/${PROP}/order-book`)
    ).json()) as OrderBookStatePublic;
    expect(book.bids).toEqual([]);

    const again = await app.request(`/v1/orders/${id}`, {
      method: "DELETE",
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(again.status).toBe(409);
    const body = (await again.json()) as { code: string };
    expect(body.code).toBe("conflict");
  });

  it("DELETE missing id → 404", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/orders/ord_does_not_exist", {
      method: "DELETE",
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(404);
  });

  it("DELETE without auth → 401", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/orders/ord_x", { method: "DELETE" });
    expect(res.status).toBe(401);
  });

  it("portfolio openOrders scoped to session user", async () => {
    const { app } = makeApp();
    await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "buy",
        priceUsd: 10_000,
        quantity: 7,
      }),
    });

    const a = await app.request("/v1/portfolio", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    const bodyA = (await a.json()) as PortfolioSummaryPublic;
    expect(bodyA.openOrders.length).toBe(1);
    expect(bodyA.openOrders[0]!.quantity).toBe(7);
    expect(bodyA.openOrders[0]!.status).toBe("open");

    const b = await app.request("/v1/portfolio", {
      headers: { Authorization: await bearerFor("user-b") },
    });
    const bodyB = (await b.json()) as PortfolioSummaryPublic;
    expect(bodyB.openOrders).toEqual([]);
  });

  it("sell without enough shares → 409 insufficient_free_shares", async () => {
    const { app } = makeApp({
      holdings: [
        {
          userId: "user-a",
          propertyId: PROP,
          sharesOwned: 2,
          avgCostUsd: 10_000,
          updatedAt: new Date(),
        },
      ],
    });
    const res = await app.request("/v1/orders", {
      method: "POST",
      headers: {
        Authorization: await bearerFor("user-a"),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        propertyId: PROP,
        side: "sell",
        priceUsd: 11_000,
        quantity: 50,
      }),
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("insufficient_free_shares");
    expect(body.message).toMatch(/free share/i);
  });

  describe("rate limiting (in-memory)", () => {
    it("under max → 201", async () => {
      const { app } = makeApp({
        extraUsers: [{ id: "rl-under", name: "Under" }],
      });
      for (let i = 0; i < 3; i++) {
        const res = await app.request("/v1/orders", {
          method: "POST",
          headers: {
            Authorization: await bearerFor("rl-under"),
            "content-type": "application/json",
          },
          body: JSON.stringify({
            propertyId: PROP,
            side: "buy",
            priceUsd: 10_001 + i,
            quantity: 1,
          }),
        });
        expect(res.status).toBe(201);
      }
    });

    it("exceeds max → 429", async () => {
      const { app } = makeApp({
        extraUsers: [{ id: "rl-exceed", name: "Exceed" }],
      });

      for (let i = 0; i < 31; i++) {
        const res = await app.request("/v1/orders", {
          method: "POST",
          headers: {
            Authorization: await bearerFor("rl-exceed"),
            "content-type": "application/json",
          },
          body: JSON.stringify({
            propertyId: PROP,
            side: "buy",
            priceUsd: 10_000,
            quantity: 1,
          }),
        });
        if (res.status === 429) {
          const body = (await res.json()) as { code: string };
          expect(body.code).toBe("rate_limit_exceeded");
          return;
        }
      }
      throw new Error("expected 429 but all 31 requests succeeded");
    });

    it("is per-user (other unaffected)", async () => {
      const { app } = makeApp({
        extraUsers: [
          { id: "rl-heavy", name: "Heavy" },
          { id: "rl-light", name: "Light" },
        ],
      });

      // Exhaust rl-heavy
      for (let i = 0; i < 31; i++) {
        await app.request("/v1/orders", {
          method: "POST",
          headers: {
            Authorization: await bearerFor("rl-heavy"),
            "content-type": "application/json",
          },
          body: JSON.stringify({
            propertyId: PROP,
            side: "buy",
            priceUsd: 10_000,
            quantity: 1,
          }),
        });
      }

      // rl-light still works
      const res = await app.request("/v1/orders", {
        method: "POST",
        headers: {
          Authorization: await bearerFor("rl-light"),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          propertyId: PROP,
          side: "buy",
          priceUsd: 10_000,
          quantity: 1,
        }),
      });
      expect(res.status).toBe(201);
    });
  });
});
