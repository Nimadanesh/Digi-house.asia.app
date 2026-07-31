import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import {
  createMemoryHoldingStore,
  type HoldingRowInput,
} from "../portfolio/holding-store.js";
import type { PortfolioSummaryPublic } from "../portfolio/map-portfolio.js";
import { projectedYieldUsd, weeklyRentUsd } from "../portfolio/math.js";

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

function makeApp(holdingSeed: HoldingRowInput[] = []) {
  const users = createMemoryUserStore([
    seedUser("user-a", "Alice"),
    seedUser("user-b", "Bob"),
  ]);
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  const holdings = createMemoryHoldingStore(holdingSeed);
  const app = createApp({
    env: testEnv(),
    log: silentLog,
    users,
    properties,
    holdings,
  });
  return app;
}

const BAYSIDE = "prop-bayside-marina-penthouse";
const ALFAMA = "prop-alfama-terrace-flat";

function holding(
  userId: string,
  propertyId: string,
  sharesOwned: number,
  avgCostUsd: number,
): HoldingRowInput {
  return {
    userId,
    propertyId,
    sharesOwned,
    avgCostUsd,
    updatedAt: new Date(),
  };
}

describe("GET /v1/portfolio", () => {
  it("returns 401 without Authorization", async () => {
    const app = makeApp();
    const res = await app.request("/v1/portfolio");
    expect(res.status).toBe(401);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("unauthorized");
  });

  it("returns empty summary for user with zero holdings", async () => {
    const app = makeApp();
    const res = await app.request("/v1/portfolio", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PortfolioSummaryPublic;
    expect(body).toEqual({
      totalValueUsd: 0,
      totalInvestedUsd: 0,
      totalEarningsUsd: 0,
      weeklyProjectedUsd: 0,
      dayChangeRatio: 0,
      holdings: [],
      openOrders: [],
    });
  });

  it("returns derived holdings math for seeded user A", async () => {
    const app = makeApp([
      holding("user-a", BAYSIDE, 160, 25_000),
      holding("user-a", ALFAMA, 200, 10_000),
    ]);
    const res = await app.request("/v1/portfolio", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PortfolioSummaryPublic;

    expect(body.holdings).toHaveLength(2);
    expect(body.totalEarningsUsd).toBe(0);
    expect(body.openOrders).toEqual([]);

    const seedProps = Object.fromEntries(
      SEED_PROPERTIES.map((p) => [p.id, p]),
    );
    const bay = seedProps[BAYSIDE]!;
    const alf = seedProps[ALFAMA]!;

    for (const h of body.holdings) {
      expect(Number.isInteger(h.sharesOwned)).toBe(true);
      expect(Number.isInteger(h.avgCostUsd)).toBe(true);
      expect(Number.isInteger(h.currentValueUsd)).toBe(true);
      expect(Number.isInteger(h.pendingWeekEarningsUsd)).toBe(true);
    }

    const hBay = body.holdings.find((h) => h.propertyId === BAYSIDE)!;
    const hAlf = body.holdings.find((h) => h.propertyId === ALFAMA)!;
    expect(hBay).toBeDefined();
    expect(hAlf).toBeDefined();

    expect(hBay.currentValueUsd).toBe(160 * bay.sharePriceUsd);
    expect(hBay.pendingWeekEarningsUsd).toBe(
      projectedYieldUsd(
        weeklyRentUsd(bay.annualRentUsd),
        160,
        bay.totalShares,
      ),
    );
    expect(hAlf.currentValueUsd).toBe(200 * alf.sharePriceUsd);
    expect(hAlf.pendingWeekEarningsUsd).toBe(
      projectedYieldUsd(
        weeklyRentUsd(alf.annualRentUsd),
        200,
        alf.totalShares,
      ),
    );

    expect(body.totalInvestedUsd).toBe(160 * 25_000 + 200 * 10_000);
    expect(body.totalValueUsd).toBe(
      hBay.currentValueUsd + hAlf.currentValueUsd,
    );
    expect(body.weeklyProjectedUsd).toBe(
      hBay.pendingWeekEarningsUsd + hAlf.pendingWeekEarningsUsd,
    );
    expect(Number.isInteger(body.totalValueUsd)).toBe(true);
    expect(Number.isInteger(body.totalInvestedUsd)).toBe(true);
    expect(Number.isInteger(body.weeklyProjectedUsd)).toBe(true);
  });

  it("does not leak user A holdings to user B (IDOR)", async () => {
    const app = makeApp([
      holding("user-a", BAYSIDE, 160, 25_000),
      holding("user-a", ALFAMA, 200, 10_000),
    ]);
    const res = await app.request("/v1/portfolio", {
      headers: { Authorization: await bearerFor("user-b") },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as PortfolioSummaryPublic;
    expect(body.holdings).toEqual([]);
    expect(body.totalValueUsd).toBe(0);
    expect(body.totalInvestedUsd).toBe(0);
  });
});

describe("GET /v1/portfolio/export.csv", () => {
  it("returns 401 without Authorization", async () => {
    const app = makeApp();
    const res = await app.request("/v1/portfolio/export.csv");
    expect(res.status).toBe(401);
  });

  it("returns CSV with header row and rows for user A holdings", async () => {
    const app = makeApp([
      holding("user-a", BAYSIDE, 160, 25_000),
      holding("user-a", ALFAMA, 200, 10_000),
    ]);
    const res = await app.request("/v1/portfolio/export.csv", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/csv/);
    expect(res.headers.get("content-disposition")).toMatch(/attachment/);
    const body = await res.text();
    const lines = body.trim().split("\n");
    expect(lines[0]).toBe("propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio");
    expect(lines.length).toBe(3);
    const row2 = lines[1]!.split(",");
    expect(row2[0]).toBe(BAYSIDE);
    expect(row2[2]).toBe("160");
    expect(row2[3]).toBe("25000");
    expect(Number.isInteger(Number(row2[3]))).toBe(true);
  });

  it("cents are integers (no decimal formatting)", async () => {
    const app = makeApp([
      holding("user-a", BAYSIDE, 160, 25_000),
    ]);
    const seedProps = Object.fromEntries(
      SEED_PROPERTIES.map((p) => [p.id, p]),
    );
    const bay = seedProps[BAYSIDE]!;
    const expectedCurrentValueUsd = 160 * bay.sharePriceUsd;
    const expectedWeekly = Math.floor(bay.annualRentUsd / 52);
    const expectedPendingWeekEarnings = Math.floor(expectedWeekly * 160 / bay.totalShares);

    const res = await app.request("/v1/portfolio/export.csv", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    const body = await res.text();
    const lines = body.trim().split("\n");
    const cols = lines[1]!.split(",");
    expect(cols[3]).toBe("25000");
    expect(cols[4]).toBe(String(expectedCurrentValueUsd));
    expect(cols[5]).toBe(String(expectedPendingWeekEarnings));
    expect(cols[5]).not.toContain(".");
  });

  it("does not leak user A holdings to user B in CSV (IDOR)", async () => {
    const app = makeApp([
      holding("user-a", BAYSIDE, 160, 25_000),
    ]);
    const res = await app.request("/v1/portfolio/export.csv", {
      headers: { Authorization: await bearerFor("user-b") },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    const lines = body.trim().split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe("propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio");
  });

  it("returns header-only CSV when portfolio is empty", async () => {
    const app = makeApp();
    const res = await app.request("/v1/portfolio/export.csv", {
      headers: { Authorization: await bearerFor("user-a") },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    const lines = body.trim().split("\n");
    expect(lines.length).toBe(1);
    expect(lines[0]).toBe("propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio");
  });
});
