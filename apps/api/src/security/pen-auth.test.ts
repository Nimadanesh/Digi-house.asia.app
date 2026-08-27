import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryIntentStore } from "../buys/intent-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryEarningsStore } from "../earnings/earnings-store.js";
import {
  buildInitDataForTests,
  FIXTURE_BOT_TOKEN,
} from "../auth/test-fixtures.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";

const silentLog = {
  info: () => {}, warn: () => {}, error: () => {}, fatal: () => {},
  debug: () => {}, trace: () => {}, child: () => silentLog,
} as unknown as Logger;

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };

function testEnv(over: Partial<ApiEnv> = {}): ApiEnv {
  return {
    NODE_ENV: "test", PORT: 8787, LOG_LEVEL: "silent",
    SETTLEMENT_MODE: undefined, DATABASE_URL: undefined,
    TELEGRAM_BOT_TOKEN: FIXTURE_BOT_TOKEN,
    SESSION_SECRET: SESSION.secret, SESSION_TTL_SECONDS: SESSION.ttlSeconds,
    CORS_ORIGIN: "http://localhost:3000", TON_RELAY_ADDRESS: undefined,
    BUY_STUB_NANOTON: "10000000", BUY_INTENT_TTL_SECONDS: 900,
    AUTH_RATE_LIMIT_MAX: 10, ADMIN_TON_WALLET_ADDRESS: undefined,
    ADMIN_USDT_WALLET_ADDRESS: undefined, USDT_JETTON_MASTER_ADDRESS: undefined,
    TON_USD_PRICE_CENTS: 200,
    REDIS_URL: undefined, ORDER_RATE_LIMIT_MAX: 999,
    ORDER_RATE_LIMIT_WINDOW_MS: 60000, PAYOUT_TICK_MS: 60000,
    PAYOUT_WORKER_ENABLED: false, ALLOW_MANUAL_PAYOUT_TICK: false,
    PAYOUT_TICK_SECRET: undefined, NOTIFY_EARNINGS_PAID: false,
    TON_API_URL: "https://testnet.tonapi.io", TON_API_KEY: undefined,
    INDEXER_POLL_MS: 10_000, INDEXER_ENABLED: false,
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
    WITHDRAWAL_WORKER_ENABLED: false,
    WITHDRAWAL_TICK_MS: 60_000,
    NFT_WORKER_ENABLED: false,
    NFT_TICK_MS: 60_000,
    NFT_MINTER_MODE: "simulated" as const,
    NFT_NETWORK: "testnet" as const,
    NFT_MINTER_MNEMONIC: undefined,
    NFT_COLLECTION_ADDRESS: undefined,
    TONCENTER_API_URL: "https://testnet.toncenter.com/api/v2/jsonRPC",
    TONCENTER_API_KEY: undefined,
    NFT_METADATA_BASE_URL: "http://localhost:8787",
    NFT_JOB_ATTEMPTS: 3,
    NFT_STALE_PENDING_MS: 300_000,
    NFT_STALE_ACTIVE_MS: 1_800_000,
    ...over,
  };
}

function makeApp(users = createMemoryUserStore()) {
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore();
  const earnings = createMemoryEarningsStore();
  const orders = createMemoryOrderStore();
  const intents = createMemoryIntentStore();
  const transactions = createMemoryTxStore();
  const audit = createMemoryAuditStore();
  const app = createApp({
    env: testEnv(), log: silentLog, users, properties, holdings, earnings,
    orders, intents, transactions, audit,
  });
  return { app, users };
}

function makeAuthApp(users = createMemoryUserStore()) {
  const app = createApp({ env: testEnv(), log: silentLog, users });
  return { app, users };
}

describe("P5-01 Auth: Telegram initData validation", () => {
  describe("POST /v1/auth/telegram", () => {
    it("valid initData → 200 + token", async () => {
      const { app } = makeAuthApp();
      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 10,
        user: { id: 4242, first_name: "Alice" },
      });
      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { token: string };
      expect(body.token.length).toBeGreaterThan(20);
    });

    it("empty initData → 400", async () => {
      const { app } = makeAuthApp();
      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: "" }),
      });
      expect(res.status).toBe(400);
    });

    it("missing body → 400", async () => {
      const { app } = makeAuthApp();
      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
      });
      expect(res.status).toBe(400);
    });

    it("invalid hash → 401", async () => {
      const { app } = makeAuthApp();
      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 10,
        user: { id: 4242, first_name: "Alice" },
      });
      const tampered = initData.replace(/hash=[a-f0-9]+/, "hash=0000000000000000000000000000000000000000000000000000000000000000");
      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData: tampered }),
      });
      expect(res.status).toBe(401);
    });

    it("expired auth_date (>24h) → 401", async () => {
      const { app } = makeAuthApp();
      const initData = buildInitDataForTests(FIXTURE_BOT_TOKEN, {
        authDate: Math.floor(Date.now() / 1000) - 86_400 - 1,
        user: { id: 4242, first_name: "Alice" },
      });
      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      expect(res.status).toBe(401);
    });

    it("wrong bot token → 401", async () => {
      const wrongBot = "wrong-bot-token-not-valid";
      const initData = buildInitDataForTests(wrongBot, {
        authDate: Math.floor(Date.now() / 1000) - 10,
        user: { id: 4242, first_name: "Alice" },
      });
      const { app } = makeAuthApp();
      const res = await app.request("/v1/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      expect(res.status).toBe(401);
    });
  });
});

describe("P5-01 Auth: bearer token validation", () => {
  const privateRoutes = [
    ["GET", "/v1/me"],
    ["GET", "/v1/portfolio"],
    ["GET", "/v1/earnings"],
    ["GET", "/v1/transactions"],
    ["POST", "/v1/orders"],
    ["POST", "/v1/buys/prepare"],
    ["POST", "/v1/buys/confirm"],
    ["POST", "/v1/buys/verify-and-settle"],
    ["DELETE", "/v1/orders/does-not-exist"],
  ] as const;

  it.each(privateRoutes)("%s %s → 401 without auth", async (method, path) => {
    const { app } = makeApp();
    const res = await app.request(path, { method });
    expect(res.status).toBe(401);
  }, 10_000);

  it("garbage Bearer token → 401", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/me", {
      headers: { Authorization: "Bearer garbage-token-that-is-not-a-real-jwt" },
    });
    expect(res.status).toBe(401);
  });

  it("malformed Authorization header (no Bearer) → 401", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/me", {
      headers: { Authorization: "Basic some-base64-credentials" },
    });
    expect(res.status).toBe(401);
  });

  it("valid bearer on GET /v1/me → 200", async () => {
    const { app, users } = makeApp();
    await users.upsertFromTelegram({ userId: "user-a", displayName: "Alice" });
    const { token } = await signSessionToken("user-a", SESSION);
    const res = await app.request("/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});
