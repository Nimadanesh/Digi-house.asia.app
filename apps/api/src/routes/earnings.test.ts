import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { tonFromUsdCents } from "../earnings/constants.js";
import {
  createMemoryEarningsStore,
  type EarningsEntryRowInput,
} from "../earnings/earnings-store.js";
import type { EarningsSummaryPublic } from "../earnings/map-earnings.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";

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
    referredByUserId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeApp(entrySeed: EarningsEntryRowInput[] = []) {
  const users = createMemoryUserStore([
    seedUser("user-a", "Alice"),
    seedUser("user-b", "Bob"),
  ]);
  const earnings = createMemoryEarningsStore(entrySeed);
  return createApp({
    env: testEnv(),
    log: silentLog,
    users,
    earnings,
  });
}

/** Mirror Mini App mock: 4 weeks × 2 properties; weeks 0–2 paid, week 3 pending. */
const WEEKS = [
  "2026-06-29T00:00:00Z",
  "2026-07-06T00:00:00Z",
  "2026-07-13T00:00:00Z",
  "2026-07-20T00:00:00Z",
] as const;

const BAYSIDE = "prop-bayside-marina-penthouse";
const ALFAMA = "prop-alfama-terrace-flat";

/** rent pools from mock distributions — floor(pool * ratio) must hold. */
const RENT_POOL: Record<string, number> = {
  [BAYSIDE]: 20_000,
  [ALFAMA]: 25_000,
};

const SHARE_RATIO = 0.2;

function mockEntriesForUser(userId: string): EarningsEntryRowInput[] {
  const out: EarningsEntryRowInput[] = [];
  for (let i = 0; i < WEEKS.length; i++) {
    const weekOf = WEEKS[i]!;
    const paid = i < 3;
    for (const propertyId of [BAYSIDE, ALFAMA]) {
      const rentPoolUsd = RENT_POOL[propertyId]!;
      const amountUsd = Math.floor(rentPoolUsd * SHARE_RATIO);
      const day = weekOf.slice(0, 10);
      const slug = propertyId.includes("bayside") ? "bayside" : "alfama";
      out.push({
        id: `earn-${slug}-${day}`,
        userId,
        propertyId,
        distributionId: `dist-${slug}-${day}`,
        weekOf,
        amountUsd,
        tonAmount: tonFromUsdCents(amountUsd),
        shareRatio: SHARE_RATIO,
        status: paid ? "paid" : "pending",
        txHash: paid ? `simulated:${slug}-${day}` : null,
      });
    }
  }
  return out;
}

describe("GET /v1/earnings", () => {
  it("returns 401 without Authorization", async () => {
    const app = makeApp();
    const res = await app.request("/v1/earnings");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("unauthorized");
  });

  it("returns empty summary for user with zero entries", async () => {
    const app = makeApp();
    const res = await app.request("/v1/earnings", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as EarningsSummaryPublic;
    expect(body).toEqual({
      allTimeUsd: 0,
      thisWeekProjectedUsd: 0,
      projectedNextWeekUsd: 0,
      entries: [],
    });
  });

  it("returns ≥4 weeks paid+pending with floor math and simulated txHash", async () => {
    const seed = mockEntriesForUser("user-a");
    const app = makeApp(seed);
    const res = await app.request("/v1/earnings", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as EarningsSummaryPublic;

    expect(body.entries.length).toBeGreaterThanOrEqual(4);
    expect(body.entries.length).toBe(8);
    const weeks = new Set(body.entries.map((e) => e.weekOf));
    expect(weeks.size).toBeGreaterThanOrEqual(4);

    const paid = body.entries.filter((e) => e.status === "paid");
    const pending = body.entries.filter((e) => e.status === "pending");
    expect(paid.length).toBe(6);
    expect(pending.length).toBe(2);

    for (const e of paid) {
      expect(e.txHash?.startsWith("simulated:")).toBe(true);
    }
    for (const e of pending) {
      expect(e.txHash).toBeUndefined();
    }

    for (const e of body.entries) {
      expect(Number.isInteger(e.amountUsd)).toBe(true);
      expect(Number.isInteger(e.tonAmount)).toBe(true);
      const pool = RENT_POOL[e.propertyId]!;
      expect(e.amountUsd).toBe(Math.floor(pool * e.shareRatio));
      expect(e.tonAmount).toBe(tonFromUsdCents(e.amountUsd));
    }

    expect(body.allTimeUsd).toBe(paid.reduce((s, e) => s + e.amountUsd, 0));
    expect(body.thisWeekProjectedUsd).toBe(
      pending.reduce((s, e) => s + e.amountUsd, 0),
    );
    expect(body.projectedNextWeekUsd).toBe(body.thisWeekProjectedUsd);
    expect(Number.isInteger(body.allTimeUsd)).toBe(true);
    expect(Number.isInteger(body.thisWeekProjectedUsd)).toBe(true);

    // newest week first
    for (let i = 1; i < body.entries.length; i++) {
      expect(
        body.entries[i - 1]!.weekOf >= body.entries[i]!.weekOf,
      ).toBe(true);
    }
    expect(body.entries[0]!.weekOf).toBe(WEEKS[3]);
  });

  it("does not leak user A entries to user B (IDOR)", async () => {
    const app = makeApp(mockEntriesForUser("user-a"));
    const res = await app.request("/v1/earnings", {
      headers: { Authorization: await bearerFor("user-b") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as EarningsSummaryPublic;
    expect(body.entries).toEqual([]);
    expect(body.allTimeUsd).toBe(0);
  });
});
