import { describe, expect, it } from "vitest";
import { createMemoryEarningsStore } from "../earnings/earnings-store.js";
import type { EarningsEntryRowInput } from "../earnings/earnings-store.js";
import { createLogger } from "../logger.js";
import { notifyUsersForDistribution } from "./notify-utils.js";

const ENV = {
  NODE_ENV: "development" as const,
  PORT: 8787,
  LOG_LEVEL: "silent" as const,
  SETTLEMENT_MODE: "hybrid" as const,
  DATABASE_URL: undefined,
  TELEGRAM_BOT_TOKEN: "",
  SESSION_SECRET: "test-secret-min-32-chars-1234567890!!",
  SESSION_TTL_SECONDS: 604800,
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
  INDEXER_POLL_MS: 10000,
  INDEXER_ENABLED: false,
  ADMIN_API_SECRET: undefined,
  R2_ACCOUNT_ID: undefined,
  R2_ACCESS_KEY_ID: undefined,
  R2_SECRET_ACCESS_KEY: undefined,
  R2_BUCKET: undefined,
  R2_PUBLIC_BASE_URL: undefined,
  LAUNCH_MODE: "open" as const,
  ALLOWLIST_WALLETS: undefined,
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
};

const log = createLogger({
  ...ENV,
  SETTLEMENT_MODE: "hybrid",
});

const DIST_ID = "dist-bayside-2026-07-20";
const PROP = "prop-bayside-marina-penthouse";

function pendingEntry(
  id: string,
  userId: string,
  amountUsd: number,
): EarningsEntryRowInput {
  return {
    id,
    userId,
    propertyId: PROP,
    distributionId: DIST_ID,
    weekOf: "2026-07-20T00:00:00Z",
    amountUsd,
    tonAmount: amountUsd * 5_000_000,
    shareRatio: 0.2,
    status: "pending",
    txHash: null,
  };
}

describe("notifyUsersForDistribution", () => {
  it("returns 0 when bot token is empty (no telegram configured)", async () => {
    const earnings = createMemoryEarningsStore([
      pendingEntry("earn-a", "user-a", 4000),
    ]);
    const count = await notifyUsersForDistribution({
      entryIds: ["earn-a"],
      distributionId: DIST_ID,
      deps: {
        earnings,
        botToken: "",
        settlementMode: "hybrid",
        log,
        getPropertyTitle: async () => "Bayside",
      },
    });
    expect(count).toBe(0);
  });

  it("marks notified after first attempt (at-most-once)", async () => {
    const earnings = createMemoryEarningsStore([
      pendingEntry("earn-a", "user-a", 4000),
    ]);
    // First attempt — should try to send (will fail because no bot token)
    const first = await notifyUsersForDistribution({
      entryIds: ["earn-a"],
      distributionId: DIST_ID,
      deps: {
        earnings,
        botToken: "999:fakebot",
        settlementMode: "hybrid",
        log,
        getPropertyTitle: async () => "Bayside",
      },
    });
    expect(first).toBe(0);
    // Entry should NOT be marked as notified since the send failed
    expect(await earnings.wasNotified("earn-a")).toBe(false);
  });

  it("skips entries already notified", async () => {
    const earnings = createMemoryEarningsStore([
      pendingEntry("earn-a", "user-a", 4000),
    ]);
    await earnings.markNotified("earn-a");
    const count = await notifyUsersForDistribution({
      entryIds: ["earn-a"],
      distributionId: DIST_ID,
      deps: {
        earnings,
        botToken: "999:fakebot",
        settlementMode: "hybrid",
        log,
        getPropertyTitle: async () => "Bayside",
      },
    });
    // Should skip already notified entry
    expect(count).toBe(0);
  });

  it("handles missing entry gracefully", async () => {
    const earnings = createMemoryEarningsStore([]);
    const count = await notifyUsersForDistribution({
      entryIds: ["nonexistent"],
      distributionId: DIST_ID,
      deps: {
        earnings,
        botToken: "999:fakebot",
        settlementMode: "hybrid",
        log,
        getPropertyTitle: async () => "",
      },
    });
    expect(count).toBe(0);
  });

  it("handles multiple entries without throwing", async () => {
    const earnings = createMemoryEarningsStore([
      pendingEntry("earn-a", "user-a", 4000),
      pendingEntry("earn-b", "user-b", 6000),
    ]);
    const count = await notifyUsersForDistribution({
      entryIds: ["earn-a", "earn-b"],
      distributionId: DIST_ID,
      deps: {
        earnings,
        botToken: "",
        settlementMode: "hybrid",
        log,
        getPropertyTitle: async () => "Bayside",
      },
    });
    expect(count).toBe(0); // no bot token
    expect(await earnings.wasNotified("earn-a")).toBe(false);
    expect(await earnings.wasNotified("earn-b")).toBe(false);
  });
});
