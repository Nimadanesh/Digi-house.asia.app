// Shared helper for Phase F money-path integration tests (PF-01/PF-02).
// Wires a full createApp with every memory store + a fake on-chain client, so a
// test can walk a complete money path through the real HTTP routes (prepare →
// confirm → verify-and-settle → lock → yield tick → unlock → mature → sell/match
// → withdrawal) exactly as a live stack would, minus Postgres/Redis.
import { createApp } from "../app.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryIntentStore } from "../buys/intent-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import type { PropertyMetaJson } from "../db/schema/properties.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryEarningsStore } from "../earnings/earnings-store.js";
import type { ApiEnv } from "../env.js";
import { createMemoryFeeTierStore } from "../fees/fee-tier-store.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryTradeStore } from "../orders/trade-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryInstantSellStore } from "../sells/instant-sell-store.js";
import type { OnChainTx, TonTxClient } from "../ton/tx-client.js";
import { createMemoryWithdrawalStore } from "../withdrawals/withdrawal-store.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryYieldStore } from "../yield/yield-store.js";

export const SESSION = {
  secret: "test-session-secret-at-least-32-chars",
  ttlSeconds: 3600,
};

/** Raw admin receive wallet — the fake tx sends the payment here. */
export const ADMIN_RAW =
  "0:1111111111111111111111111111111111111111111111111111111111111111";
/** Huge value so the amount check always passes regardless of quantity. */
export const HUGE_NANO = "999999999999999999999";

export const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  debug: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

export function testEnv(over: Partial<ApiEnv> = {}): ApiEnv {
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
    ADMIN_TON_WALLET_ADDRESS: ADMIN_RAW,
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
    ADMIN_API_SECRET: "test-admin-secret-at-least-32-chars!!",
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
    ...over,
  };
}

export function seedUser(
  id: string,
  displayName: string,
  walletAddress: string | null = null,
) {
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

export async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function txRow(over: Partial<OnChainTx> = {}): OnChainTx {
  return {
    hash: "a".repeat(64),
    success: true,
    utime: Math.floor(Date.now() / 1000),
    accountAddress: "0:5555555555555555555555555555555555555555555555555555555555555555",
    outMessages: [{ destinationAddress: ADMIN_RAW, valueNano: HUGE_NANO }],
    ...over,
  };
}

/** Fake on-chain client: every payment verifies against the admin wallet. */
export function fakeTonClient(over: Partial<TonTxClient> = {}): TonTxClient {
  return {
    async getTransactionByMessageHash() {
      return { kind: "found" as const, tx: txRow() };
    },
    async getJettonTransfer() {
      return { kind: "not_found" as const };
    },
    async getJettonWalletAddress() {
      return { kind: "error" as const };
    },
    ...over,
  };
}

export type MoneyPathHarness = {
  app: ReturnType<typeof createApp>;
  users: ReturnType<typeof createMemoryUserStore>;
  properties: ReturnType<typeof createMemoryPropertyStore>;
  holdings: ReturnType<typeof createMemoryHoldingStore>;
  earnings: ReturnType<typeof createMemoryEarningsStore>;
  orders: ReturnType<typeof createMemoryOrderStore>;
  intents: ReturnType<typeof createMemoryIntentStore>;
  transactions: ReturnType<typeof createMemoryTxStore>;
  feeTiers: ReturnType<typeof createMemoryFeeTierStore>;
  locks: ReturnType<typeof createMemoryShareLockStore>;
  yields: ReturnType<typeof createMemoryYieldStore>;
  balances: ReturnType<typeof createMemoryBalanceStore>;
  instantSells: ReturnType<typeof createMemoryInstantSellStore>;
  trades: ReturnType<typeof createMemoryTradeStore>;
  withdrawals: ReturnType<typeof createMemoryWithdrawalStore>;
  audit: ReturnType<typeof createMemoryAuditStore>;
};

export type ExtraProperty = {
  id: string;
  totalShares: number;
  sharesSold: number;
  sharePriceUsd: number;
  status: "funding" | "funded" | "resale";
};

export function makeHarness(opts: {
  /** Extra users beyond user-a/user-b/user-c. */
  extraUsers?: Array<{ id: string; name: string; wallet?: string | null }>;
  /** Extra properties to seed (created in the memory property store). */
  extraProperties?: ExtraProperty[];
  env?: Partial<ApiEnv>;
} = {}): MoneyPathHarness {
  const users = createMemoryUserStore([
    seedUser("user-a", "Alice"),
    seedUser("user-b", "Bob"),
    seedUser("user-c", "Carol"),
    ...(opts.extraUsers ?? []).map((u) =>
      seedUser(u.id, u.name, u.wallet ?? null),
    ),
  ]);
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  for (const p of opts.extraProperties ?? []) {
    properties._rows.push({
      id: p.id,
      title: p.id,
      location: "Test",
      description: "Test property",
      images: [],
      totalShares: p.totalShares,
      sharePriceUsd: p.sharePriceUsd,
      annualRentUsd: p.totalShares * p.sharePriceUsd * 12,
      ownerWalletAddress: "EQTestWallet",
      meta: { yearBuilt: 2020 } as PropertyMetaJson,
      status: p.status,
      sharesSold: p.sharesSold,
      monthlyYieldRate: "6.00",
      totalValueUsd: p.totalShares * p.sharePriceUsd,
      tokenizationStatus: "pending" as const,
      rentalHistory: [],
      jettonDecimals: 9,
      salePaused: false,
      distributionPaused: false,
      onchainMaster: null,
      distributionAddress: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  const holdings = createMemoryHoldingStore();
  const earnings = createMemoryEarningsStore();
  const orders = createMemoryOrderStore();
  const intents = createMemoryIntentStore();
  const transactions = createMemoryTxStore();
  const feeTiers = createMemoryFeeTierStore();
  const locks = createMemoryShareLockStore();
  const yields = createMemoryYieldStore();
  const balances = createMemoryBalanceStore();
  const instantSells = createMemoryInstantSellStore();
  const trades = createMemoryTradeStore();
  const withdrawals = createMemoryWithdrawalStore();
  const audit = createMemoryAuditStore();

  const app = createApp({
    env: testEnv(opts.env),
    log: silentLog,
    users,
    properties,
    holdings,
    earnings,
    orders,
    documents: null,
    intents,
    transactions,
    feeTiers,
    locks,
    yields,
    balances,
    instantSells,
    trades,
    withdrawals,
    audit,
    tonTxClient: fakeTonClient(),
    prepareRateLimiter: async (_c, next) => {
      await next();
    },
  });

  return {
    app,
    users,
    properties,
    holdings,
    earnings,
    orders,
    intents,
    transactions,
    feeTiers,
    locks,
    yields,
    balances,
    instantSells,
    trades,
    withdrawals,
    audit,
  };
}

export type BuyResult = {
  intentId: string;
  status: string;
  txHash: string;
  shares: number;
};

/** Full primary buy: prepare → confirm → verify-and-settle. Returns the settled intent. */
export async function buyPrimary(
  h: MoneyPathHarness,
  userId: string,
  propertyId: string,
  quantity: number,
  opts: { txHash?: string } = {},
): Promise<BuyResult> {
  const listing = await h.properties.getById(propertyId);
  if (!listing) throw new Error(`property ${propertyId} not found`);

  const prep = await h.app.request("/v1/buys/prepare", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      propertyId,
      quantity,
      priceUsdPerShare: listing.sharePriceUsd,
    }),
  });
  if (prep.status !== 200) {
    throw new Error(`prepare failed: ${prep.status} ${await prep.text()}`);
  }
  const { intentId } = (await prep.json()) as { intentId: string };

  const txHash = opts.txHash ?? `tx_${intentId}`;
  const conf = await h.app.request("/v1/buys/confirm", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify({ intentId, boc: null, txHash }),
  });
  if (conf.status !== 200) {
    throw new Error(`confirm failed: ${conf.status} ${await conf.text()}`);
  }

  const settle = await h.app.request("/v1/buys/verify-and-settle", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify({ intentId }),
  });
  if (settle.status !== 200) {
    throw new Error(`verify-and-settle failed: ${settle.status} ${await settle.text()}`);
  }
  const body = (await settle.json()) as BuyResult;
  return body;
}

export async function placeOrder(
  h: MoneyPathHarness,
  userId: string,
  body: {
    propertyId: string;
    side: "buy" | "sell";
    priceUsd: number;
    quantity: number;
  },
) {
  return h.app.request("/v1/orders", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
