import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryIntentStore } from "../buys/intent-store.js";
import { createMemoryTxStore, type TransactionRecord } from "../buys/tx-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryEarningsStore, type EarningsEntryRowInput } from "../earnings/earnings-store.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryHoldingStore, type HoldingRowInput } from "../portfolio/holding-store.js";

const silentLog = {
  info: () => {}, warn: () => {}, error: () => {}, fatal: () => {},
  debug: () => {}, trace: () => {}, child: () => silentLog,
} as unknown as Logger;

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };

const BAYSIDE = "prop-bayside-marina-penthouse";
const ALFAMA = "prop-alfama-terrace-flat";
const MARINA = "prop-marina-vista-4b";

function testEnv(): ApiEnv {
  return {
    NODE_ENV: "test", PORT: 8787, LOG_LEVEL: "silent",
    SETTLEMENT_MODE: undefined, DATABASE_URL: undefined,
    TELEGRAM_BOT_TOKEN: "", SESSION_SECRET: SESSION.secret,
    SESSION_TTL_SECONDS: SESSION.ttlSeconds, CORS_ORIGIN: "http://localhost:3000",
    TON_RELAY_ADDRESS: undefined, BUY_STUB_NANOTON: "10000000",
    BUY_INTENT_TTL_SECONDS: 900, REDIS_URL: undefined,
    AUTH_RATE_LIMIT_MAX: 10, ADMIN_TON_WALLET_ADDRESS: undefined,
    ADMIN_USDT_WALLET_ADDRESS: undefined, USDT_JETTON_MASTER_ADDRESS: undefined,
    TON_USD_PRICE_CENTS: 200,
    ORDER_RATE_LIMIT_MAX: 999, ORDER_RATE_LIMIT_WINDOW_MS: 60000,
    PAYOUT_TICK_MS: 60000, PAYOUT_WORKER_ENABLED: false,
    ALLOW_MANUAL_PAYOUT_TICK: false, PAYOUT_TICK_SECRET: undefined,
    NOTIFY_EARNINGS_PAID: false, TON_API_URL: "https://testnet.tonapi.io",
    TON_API_KEY: undefined, INDEXER_POLL_MS: 10_000, INDEXER_ENABLED: false,
    ADMIN_API_SECRET: undefined, R2_ACCOUNT_ID: undefined,
    R2_ACCESS_KEY_ID: undefined, R2_SECRET_ACCESS_KEY: undefined,
    R2_BUCKET: undefined, R2_PUBLIC_BASE_URL: undefined,
    LAUNCH_MODE: "open", ALLOWLIST_WALLETS: undefined,
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
    id, displayName, username: null, photoUrl: null,
    role: "investor" as const, walletAddress, onboarded: false,
    useTelegramTheme: false, referredByUserId: null,
    createdAt: new Date(), updatedAt: new Date(),
  };
}

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

const ALICE = "user-a";
const BOB = "user-b";

function holding(userId: string, propertyId: string, sharesOwned: number, avgCostUsd: number): HoldingRowInput {
  return { userId, propertyId, sharesOwned, avgCostUsd, updatedAt: new Date() };
}

const ALICE_HOLDINGS: HoldingRowInput[] = [
  holding(ALICE, BAYSIDE, 100, 10_000),
  holding(ALICE, ALFAMA, 50, 5_000),
];
const BOB_HOLDINGS: HoldingRowInput[] = [
  holding(BOB, BAYSIDE, 25, 10_000),
];

function earn(
  userId: string, propertyId: string, weekOf: string, amountUsd: number,
): EarningsEntryRowInput {
  return {
    id: `earn-${userId}-${propertyId}-${weekOf}`,
    userId, propertyId, weekOf: new Date(weekOf), amountUsd,
    tonAmount: 0, shareRatio: 0.1, status: "paid", txHash: "sim:tx",
    distributionId: "dist-" + weekOf,
  };
}

const ALICE_EARNINGS: EarningsEntryRowInput[] = [
  earn(ALICE, BAYSIDE, "2026-01-06", 500),
  earn(ALICE, BAYSIDE, "2026-01-13", 480),
  earn(ALICE, ALFAMA, "2026-01-06", 200),
];
const BOB_EARNINGS: EarningsEntryRowInput[] = [
  earn(BOB, BAYSIDE, "2026-01-06", 125),
  earn(BOB, BAYSIDE, "2026-01-13", 120),
];

const BASE_TXS: TransactionRecord[] = [
  { id: "tx-alice-1", userId: ALICE, kind: "buy", propertyId: BAYSIDE, shares: 100, amountUsd: 1_000_000, tonAmount: null, status: "success", txHash: "sim:tx-a1", error: null, buyIntentId: null, createdAt: new Date("2026-01-01") },
  { id: "tx-alice-2", userId: ALICE, kind: "earnings", propertyId: BAYSIDE, shares: null, amountUsd: 500, tonAmount: null, status: "success", txHash: "sim:tx-a2", error: null, buyIntentId: null, createdAt: new Date("2026-01-10") },
  { id: "tx-bob-1", userId: BOB, kind: "buy", propertyId: BAYSIDE, shares: 25, amountUsd: 250_000, tonAmount: null, status: "success", txHash: "sim:tx-b1", error: null, buyIntentId: null, createdAt: new Date("2026-01-02") },
  { id: "tx-alice-3", userId: ALICE, kind: "sell", propertyId: ALFAMA, shares: -10, amountUsd: -50_000, tonAmount: null, status: "success", txHash: "sim:tx-a3", error: null, buyIntentId: null, createdAt: new Date("2026-01-15") },
];

function makeIdorApp() {
  const users = createMemoryUserStore([
    seedUser(ALICE, "Alice", "EQAliceWallet"),
    seedUser(BOB, "Bob", "EQBobWallet"),
  ]);
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore([...ALICE_HOLDINGS, ...BOB_HOLDINGS]);
  const earnings = createMemoryEarningsStore([...ALICE_EARNINGS, ...BOB_EARNINGS]);
  const orders = createMemoryOrderStore();
  const intents = createMemoryIntentStore();
  const transactions = createMemoryTxStore(BASE_TXS);
  const audit = createMemoryAuditStore();

  const app = createApp({
    env: testEnv(), log: silentLog, users, properties, holdings, earnings,
    orders, intents, transactions, audit,
  });

  return { app, orders, intents, transactions };
}

describe("P5-01 IDOR: cross-user resource isolation", () => {
  let ctx: ReturnType<typeof makeIdorApp>;
  let bobToken: string;
  let aliceToken: string;

  beforeAll(async () => {
    ctx = makeIdorApp();
    aliceToken = await bearerFor(ALICE);
    bobToken = await bearerFor(BOB);

    // Seed an Alice order and intent so B has something to attempt hijacking
    await ctx.orders.insert({
      id: "order-alice-1", propertyId: ALFAMA, userId: ALICE,
      makerAddress: "EQAliceWallet", side: "sell",
      priceUsd: 10_000, quantity: 10,
    });
    await ctx.intents.create({
      id: "intent-alice-1", userId: ALICE, propertyId: MARINA,
      quantity: 5, priceUsdPerShare: 8_000, totalUsd: 40_000,
      destinationAddress: "EQAliceWallet",
      expectedNanoTon: "200000000000",
      expiresAt: new Date(Date.now() + 86_400_000),
    });
  });

  describe("orders", () => {
    it("B cancel A order → 403", async () => {
      const res = await ctx.app.request(`/v1/orders/order-alice-1`, {
        method: "DELETE", headers: { Authorization: bobToken },
      });
      expect(res.status).toBe(403);
    });

    it("A can cancel own order → 204", async () => {
      const res = await ctx.app.request(`/v1/orders/order-alice-1`, {
        method: "DELETE", headers: { Authorization: aliceToken },
      });
      expect(res.status).toBe(204);
    });
  });

  describe("portfolio", () => {
    it("B portfolio does not include A holdings", async () => {
      const res = await ctx.app.request("/v1/portfolio", {
        headers: { Authorization: bobToken },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { holdings: Array<{ propertyId: string; sharesOwned: number }> };
      for (const h of body.holdings) {
        expect(h.propertyId).not.toBe(ALFAMA);
      }
      const aliceProp = body.holdings.find((h) => h.propertyId === ALFAMA);
      expect(aliceProp).toBeUndefined();
    });

    it("A portfolio includes own holdings", async () => {
      const res = await ctx.app.request("/v1/portfolio", {
        headers: { Authorization: aliceToken },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { holdings: Array<{ propertyId: string }> };
      expect(body.holdings.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("earnings", () => {
    it("B earnings do not include A entries", async () => {
      const res = await ctx.app.request("/v1/earnings", {
        headers: { Authorization: bobToken },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { entries: Array<{ week: number }> };
      expect(body.entries).toHaveLength(BOB_EARNINGS.length);
    });

    it("A earnings include own entries", async () => {
      const res = await ctx.app.request("/v1/earnings", {
        headers: { Authorization: aliceToken },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { entries: Array<{ week: number }> };
      expect(body.entries.length).toBeGreaterThanOrEqual(ALICE_EARNINGS.length);
    });
  });

  describe("transactions", () => {
    it("B transactions do not include A rows", async () => {
      const res = await ctx.app.request("/v1/transactions", {
        headers: { Authorization: bobToken },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }> };
      for (const tx of body.transactions) {
        expect(tx.id).not.toMatch(/^tx-alice-/);
      }
    });

    it("A transactions include own rows", async () => {
      const res = await ctx.app.request("/v1/transactions", {
        headers: { Authorization: aliceToken },
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { transactions: Array<{ id: string }> };
      const aliceIds = body.transactions.filter((t) => t.id.startsWith("tx-alice-"));
      expect(aliceIds.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("buy intents", () => {
    it("B confirm A intent → 404 (not 200)", async () => {
      const res = await ctx.app.request("/v1/buys/confirm", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: bobToken },
        body: JSON.stringify({ intentId: "intent-alice-1", boc: "simulated:boc" }),
      });
      expect(res.status).toBe(404);
    });

    it("A prepare sets userId from session, not body", async () => {
      const res = await ctx.app.request("/v1/buys/prepare", {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: bobToken },
        body: JSON.stringify({ propertyId: MARINA, quantity: 1, priceUsdPerShare: 8_000, userId: ALICE }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { intentId: string };
      const intent = await ctx.intents.getById(body.intentId);
      expect(intent?.userId).toBe(BOB);
    });
  });
});
