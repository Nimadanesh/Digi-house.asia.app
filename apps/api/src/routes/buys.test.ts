import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryIntentStore } from "../buys/intent-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import type { ListingPublic } from "../marketplace/map-listing.js";
import {
  createMemoryHoldingStore,
  type HoldingRowInput,
} from "../portfolio/holding-store.js";
import type { PortfolioSummaryPublic } from "../portfolio/map-portfolio.js";
import type { HoldingPublic } from "../portfolio/map-portfolio.js";
import type { TransactionPublic } from "../buys/tx-store.js";

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

/** funding, remaining = 1000-920 = 80 */
const FUNDING = "prop-marina-vista-4b";
const PRICE = 12_500;
/** funded — primary sale closed */
const FUNDED = "prop-bayside-marina-penthouse";

function testEnv(over: Partial<ApiEnv> = {}): ApiEnv {
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
    REDIS_URL: undefined,
    PAYOUT_TICK_MS: 60000,
    PAYOUT_WORKER_ENABLED: false,
    ALLOW_MANUAL_PAYOUT_TICK: false,
    PAYOUT_TICK_SECRET: undefined,
    ...over,
  };
}

function seedUser(id: string, displayName: string) {
  return {
    id,
    displayName,
    username: null,
    photoUrl: null,
    role: "investor" as const,
    walletAddress: null,
    onboarded: false,
    useTelegramTheme: false,
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
  intentTtlSeconds?: number;
} = {}) {
  const users = createMemoryUserStore([
    seedUser("user-a", "Alice"),
    seedUser("user-b", "Bob"),
  ]);
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  const holdings = createMemoryHoldingStore(opts.holdings ?? []);
  const intents = createMemoryIntentStore();
  const transactions = createMemoryTxStore();
  const audit = createMemoryAuditStore();
  const app = createApp({
    env: testEnv({
      BUY_INTENT_TTL_SECONDS: opts.intentTtlSeconds ?? 900,
    }),
    log: silentLog,
    users,
    properties,
    holdings,
    intents,
    transactions,
    audit,
  });
  return { app, properties, holdings, intents, transactions, audit };
}

async function prepare(
  app: ReturnType<typeof createApp>,
  userId: string,
  body: {
    propertyId: string;
    quantity: number;
    priceUsdPerShare: number;
  },
) {
  return app.request("/v1/buys/prepare", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function confirm(
  app: ReturnType<typeof createApp>,
  userId: string,
  intentId: string,
  boc?: string | null,
) {
  return app.request("/v1/buys/confirm", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify({ intentId, boc: boc ?? null }),
  });
}

describe("POST /v1/buys/prepare", () => {
  it("returns 401 without auth", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/buys/prepare", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propertyId: FUNDING,
        quantity: 1,
        priceUsdPerShare: PRICE,
      }),
    });
    expect(res.status).toBe(401);
  });

  it("happy path funding property", async () => {
    const { app } = makeApp();
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 5,
      priceUsdPerShare: PRICE,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intentId: string;
      totalUsd: number;
      expiresAt: string;
      quantity: number;
      priceUsdPerShare: number;
      tonConnectMessages: Array<{ address: string; amount: string }>;
    };
    expect(body.intentId.length).toBeGreaterThan(8);
    expect(body.totalUsd).toBe(5 * PRICE);
    expect(body.quantity).toBe(5);
    expect(body.priceUsdPerShare).toBe(PRICE);
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(body.tonConnectMessages.length).toBeGreaterThanOrEqual(1);
    expect(body.tonConnectMessages[0]!.amount).toBe("10000000");
  });

  it("quantity > remaining → 400", async () => {
    const { app } = makeApp();
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 10_000,
      priceUsdPerShare: PRICE,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("validation_error");
    expect(body.message).toMatch(/exceeds/i);
  });

  it("wrong price → 400", async () => {
    const { app } = makeApp();
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: 1,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/list price/i);
  });

  it("funded property → 400", async () => {
    const { app } = makeApp();
    const listing = SEED_PROPERTIES.find((p) => p.id === FUNDED)!;
    const res = await prepare(app, "user-a", {
      propertyId: FUNDED,
      quantity: 1,
      priceUsdPerShare: listing.sharePriceUsd,
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { message: string };
    expect(body.message).toMatch(/not open/i);
  });

  it("unknown property → 404", async () => {
    const { app } = makeApp();
    const res = await prepare(app, "user-a", {
      propertyId: "prop-does-not-exist",
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    expect(res.status).toBe(404);
  });
});

describe("POST /v1/buys/confirm", () => {
  it("returns 401 without auth", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/buys/confirm", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intentId: "x" }),
    });
    expect(res.status).toBe(401);
  });

  it("prepare + confirm as A → holding + simulated tx", async () => {
    const { app, properties, audit } = makeApp();
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 10,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };

    const res = await confirm(app, "user-a", intentId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      transaction: TransactionPublic;
      holding: HoldingPublic;
    };
    expect(body.transaction.kind).toBe("buy");
    expect(body.transaction.status).toBe("success");
    expect(body.transaction.shares).toBe(10);
    expect(body.transaction.amountUsd).toBe(10 * PRICE);
    expect(body.transaction.txHash?.startsWith("simulated:")).toBe(true);
    expect(body.holding.sharesOwned).toBe(10);
    expect(body.holding.avgCostUsd).toBe(PRICE);
    expect(Number.isInteger(body.holding.currentValueUsd)).toBe(true);

    const listing = (await properties.getById(FUNDING)) as ListingPublic;
    expect(listing.sharesSold).toBe(920 + 10);

    const audits = await audit.listByResource("buy_intent", intentId);
    expect(audits).toHaveLength(1);
    expect(audits[0]!.action).toBe("buy.confirm");
    expect(audits[0]!.actorUserId).toBe("user-a");
    expect(audits[0]!.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("portfolio reflects holding after confirm", async () => {
    const { app } = makeApp();
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 3,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId);

    const port = await app.request("/v1/portfolio", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    const summary = (await port.json()) as PortfolioSummaryPublic;
    const h = summary.holdings.find((x) => x.propertyId === FUNDING);
    expect(h?.sharesOwned).toBe(3);
  });

  it("second confirm → 409; no double shares_sold; audit stays 1", async () => {
    const { app, properties, audit } = makeApp();
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 2,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    expect((await confirm(app, "user-a", intentId)).status).toBe(200);
    const soldAfter = (await properties.getById(FUNDING))!.sharesSold;

    const again = await confirm(app, "user-a", intentId);
    expect(again.status).toBe(409);
    const body = (await again.json()) as { code: string };
    expect(body.code).toBe("conflict");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(soldAfter);
    expect(await audit.listByResource("buy_intent", intentId)).toHaveLength(1);
  });

  it("user B cannot confirm A intent → 404", async () => {
    const { app, holdings } = makeApp();
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };

    const res = await confirm(app, "user-b", intentId);
    expect(res.status).toBe(404);
    expect(await holdings.get("user-b", FUNDING)).toBeNull();
  });

  it("expired intent → 409", async () => {
    const { app, intents } = makeApp();
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };

    const row = intents._rows.find((r) => r.id === intentId)!;
    row.expiresAt = new Date(Date.now() - 1000);

    const res = await confirm(app, "user-a", intentId);
    expect(res.status).toBe(409);
  });

  it("race on remaining shares: second confirm 409", async () => {
    const { app, properties } = makeApp();
    // remaining = 80; two prepares of 50 each
    const p1 = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 50,
      priceUsdPerShare: PRICE,
    });
    const p2 = await prepare(app, "user-b", {
      propertyId: FUNDING,
      quantity: 50,
      priceUsdPerShare: PRICE,
    });
    const id1 = ((await p1.json()) as { intentId: string }).intentId;
    const id2 = ((await p2.json()) as { intentId: string }).intentId;

    expect((await confirm(app, "user-a", id1)).status).toBe(200);
    // after 50, remaining = 30; second 50 fails
    const r2 = await confirm(app, "user-b", id2);
    expect(r2.status).toBe(409);
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(920 + 50);
  });
});
