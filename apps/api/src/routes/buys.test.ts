import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryIntentStore } from "../buys/intent-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryFeeTierStore } from "../fees/fee-tier-store.js";
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
import type { OnChainJettonTransfer, OnChainTx, TonTxClient } from "../ton/tx-client.js";

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

/** funding, remaining = 1000-2300 = 80 */
const FUNDING = "prop-marina-vista-4b";
const PRICE = 8_000;
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
  intentTtlSeconds?: number;
  adminWallet?: string;
  tonUsdPriceCents?: number;
  adminUsdtWallet?: string;
  usdtJettonMaster?: string;
  /** Map of seeded userId → connected walletAddress (USDT prepare needs one). */
  userWallets?: Record<string, string>;
  tonClient?: Partial<TonTxClient>;
} = {}) {
  const seed = [seedUser("user-a", "Alice"), seedUser("user-b", "Bob")];
  for (const [id, wallet] of Object.entries(opts.userWallets ?? {})) {
    const row = seed.find((u) => u.id === id);
    if (row) row.walletAddress = wallet;
  }
  const users = createMemoryUserStore(seed);
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
      ADMIN_TON_WALLET_ADDRESS: opts.adminWallet,
      ADMIN_USDT_WALLET_ADDRESS: opts.adminUsdtWallet,
      USDT_JETTON_MASTER_ADDRESS: opts.usdtJettonMaster,
      TON_USD_PRICE_CENTS: opts.tonUsdPriceCents ?? 200,
    }),
    log: silentLog,
    users,
    properties,
    holdings,
    intents,
    transactions,
    audit,
    feeTiers: createMemoryFeeTierStore(),
    tonTxClient: opts.tonClient
      ? { ...fakeTonClient(), ...opts.tonClient }
      : fakeTonClient(),
    prepareRateLimiter: async (_c, next) => {
      await next();
    },
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
    currency?: "TON" | "USDT";
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
  body: { boc?: string | null; txHash?: string } = {},
) {
  return app.request("/v1/buys/confirm", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      intentId,
      boc: body.boc ?? null,
      ...(body.txHash ? { txHash: body.txHash } : {}),
    }),
  });
}

async function verifyAndSettle(
  app: ReturnType<typeof createApp>,
  userId: string,
  intentId: string,
) {
  return app.request("/v1/buys/verify-and-settle", {
    method: "POST",
    headers: {
      Authorization: await bearerFor(userId),
      "content-type": "application/json",
    },
    body: JSON.stringify({ intentId }),
  });
}

/** Raw admin receive wallet (TonAPI returns raw addresses; canonicalization compares strictly). */
const ADMIN_RAW = "0:1111111111111111111111111111111111111111111111111111111111111111";
const TX_HASH = "a".repeat(64);
/** 5 shares × 8_000¢ = 40_000¢ principal + 1_200¢ tier-1 commission (3%) = 41_200¢ payable → 206 TON at 200¢/TON */
const AMOUNT_NANO = "206000000000";
/** Tier-1 (3%) commission on 5 × 8_000¢ = 1_200¢; payable = 41_200¢. */
const BUY_FEE_USD = 1_200;
const PAYABLE_USD = 41_200;

// --- USDT (Jetton) fixtures -------------------------------------------------
const USDT_MASTER_RAW = "0:2222222222222222222222222222222222222222222222222222222222222222";
const ADMIN_USDT_RAW = "0:3333333333333333333333333333333333333333333333333333333333333333";
const USER_JETTON_WALLET_RAW = "0:4444444444444444444444444444444444444444444444444444444444444444";
/** Connected buyer wallet (owner of the USDT jetton wallet). */
const USER_WALLET_RAW = "0:5555555555555555555555555555555555555555555555555555555555555555";
/** 5 shares → 41_200¢ payable (principal + 3% commission) × 10^4 = 412,000,000 base units (USDT has 6 decimals). */
const USDT_AMOUNT = "412000000";

function jettonTransfer(over: Partial<OnChainJettonTransfer> = {}): OnChainJettonTransfer {
  return {
    status: "ok",
    jettonMasterAddress: USDT_MASTER_RAW,
    senderWalletAddress: USER_JETTON_WALLET_RAW,
    recipientAddress: ADMIN_USDT_RAW,
    amount: USDT_AMOUNT,
    utime: Math.floor(Date.now() / 1000),
    ...over,
  };
}

function txRow(over: Partial<OnChainTx> = {}): OnChainTx {
  return {
    hash: TX_HASH,
    success: true,
    utime: Math.floor(Date.now() / 1000),
    accountAddress: USER_WALLET_RAW,
    outMessages: [
      { destinationAddress: ADMIN_RAW, valueNano: AMOUNT_NANO },
    ],
    ...over,
  };
}

function fakeTonClient(over: Partial<TonTxClient> = {}): TonTxClient {
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

  it("happy path funding property → admin destination + real amount", async () => {
    const ADMIN_WALLET = "EQD-receive-admin-wallet-test";
    const { app } = makeApp({ adminWallet: ADMIN_WALLET });
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 5,
      priceUsdPerShare: PRICE,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intentId: string;
      totalUsd: number;
      feeUsd?: number;
      totalPayableUsd?: number;
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
    expect(body.tonConnectMessages).toHaveLength(1);
    // principal is separate from the commission; the buyer pays principal + commission
    expect(body.feeUsd).toBe(BUY_FEE_USD);
    expect(body.totalPayableUsd).toBe(PAYABLE_USD);
    // destination is the admin receive wallet, amount = payable (principal + fee) at 200¢/TON
    expect(body.tonConnectMessages[0]!.address).toBe(ADMIN_WALLET);
    expect(body.tonConnectMessages[0]!.amount).toBe(AMOUNT_NANO);
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

  it("confirm does NOT settle: no holding, no shares_sold bump, no transaction", async () => {
    const { app, properties, holdings, transactions, intents, audit } = makeApp();
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 10,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };

    const res = await confirm(app, "user-a", intentId, {
      txHash: "cafebabedeadbeef",
      boc: "boc:0001",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intentId: string;
      status: string;
      message?: string;
    };
    expect(body.intentId).toBe(intentId);
    expect(body.status).toBe("confirmed");

    // settlement deferred → shares/holdings/transaction ledger untouched
    const listing = (await properties.getById(FUNDING)) as ListingPublic;
    expect(listing.sharesSold).toBe(2300);
    expect(await holdings.get("user-a", FUNDING)).toBeNull();
    const txs = await transactions.listByUserId("user-a");
    expect(txs).toHaveLength(0);

    // intent moved pending → confirmed (payment recorded, not settled)
    const intent = await intents.getById(intentId);
    expect(intent?.status).toBe("confirmed");
    expect(intent?.boc).toBe("boc:0001");

    const audits = await audit.listByResource("buy_intent", intentId);
    expect(audits).toHaveLength(1);
    expect(audits[0]!.action).toBe("buy.confirm");
    expect(audits[0]!.actorUserId).toBe("user-a");
    expect(audits[0]!.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("portfolio shows no holding until settlement", async () => {
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
    expect(h).toBeUndefined();
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

  it("txHash already used by another intent → 409 tx_hash_reused", async () => {
    const { app, intents, transactions } = makeApp();
    // Intent A consumes the txHash.
    const prepA = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId: intentA } = (await prepA.json()) as { intentId: string };
    expect((await confirm(app, "user-a", intentA, { txHash: TX_HASH })).status).toBe(200);

    // Intent B tries to reuse the same payment hash.
    const prepB = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId: intentB } = (await prepB.json()) as { intentId: string };
    const res = await confirm(app, "user-a", intentB, { txHash: TX_HASH });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("tx_hash_reused");

    // B stays pending — nothing confirmed, nothing settled.
    expect((await intents.getById(intentB))?.status).toBe("pending");
    expect(await transactions.listByUserId("user-a")).toHaveLength(0);
  });

  it("confirm does not mutate the prepare-time expected amount/destination", async () => {
    const { app, intents } = makeApp({ adminWallet: ADMIN_RAW });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 2,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    const before = await intents.getById(intentId);
    // 2 × 8_000¢ = 16_000¢ principal + 480¢ commission → 16_480¢ payable → 82_400_000_000 nanoTON
    expect(before?.expectedNanoTon).toBe("82400000000");
    expect(before?.destinationAddress).toBe(ADMIN_RAW);
    expect(before?.feeUsd).toBe(480);

    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const after = await intents.getById(intentId);
    expect(after?.expectedNanoTon).toBe("82400000000");
    expect(after?.destinationAddress).toBe(ADMIN_RAW);
    expect(after?.expectedJettonAmount).toBeNull();
  });
});

describe("POST /v1/buys/verify-and-settle", () => {
  it("returns 401 without auth", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/buys/verify-and-settle", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ intentId: "intent_x" }),
    });
    expect(res.status).toBe(401);
  });

  it("missing intentId → 400", async () => {
    const { app } = makeApp();
    const res = await verifyAndSettle(app, "user-a", "");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("validation_error");
  });

  it("verifies and settles: shares_sold bump + holding + success tx + audit", async () => {
    const { app, properties, holdings, transactions, intents, audit } = makeApp({
      adminWallet: ADMIN_RAW,
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 5,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intentId: string;
      status: string;
      txHash?: string;
      actualAmountNano?: string;
    };
    expect(body.intentId).toBe(intentId);
    expect(body.status).toBe("settled");
    expect(body.txHash).toBe(TX_HASH);
    expect(body.actualAmountNano).toBe(AMOUNT_NANO);

    // shares settled 2300 → 2305
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2305);
    // holding created with the purchase avg cost (no prior holding)
    const holding = await holdings.get("user-a", FUNDING);
    expect(holding?.sharesOwned).toBe(5);
    expect(holding?.avgCostUsd).toBe(PRICE);
    // ledger row written with the REAL tx hash + verified amount
    const txs = await transactions.listByUserId("user-a");
    expect(txs).toHaveLength(1);
    const tx = txs[0]!;
    expect(tx.kind).toBe("buy");
    expect(tx.status).toBe("success");
    expect(tx.txHash).toBe(TX_HASH);
    expect(tx.buyIntentId).toBe(intentId);
    expect(tx.tonAmount).toBe(Number(AMOUNT_NANO));
    // primary-market commission is recorded separately on the ledger (FractionalLuxe revenue)
    expect(tx.feeUsd).toBe(BUY_FEE_USD);
    // intent now settled with the real txHash
    const intent = await intents.getById(intentId);
    expect(intent?.status).toBe("settled");
    expect(intent?.txHash).toBe(TX_HASH);

    const audits = await audit.listByResource("buy_intent", intentId);
    expect(audits.map((a) => a.action).sort()).toEqual(["buy.confirm", "buy.settle", "buy.verify"]);
  });

  it("pending_confirmation when the tx is not on-chain yet — nothing settles", async () => {
    const { app, properties, transactions } = makeApp({
      adminWallet: ADMIN_RAW,
      tonClient: {
        async getTransactionByMessageHash() {
          return { kind: "not_found" };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("pending_confirmation");
    expect(body.reason).toBe("tx_not_found");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2300);
    expect(await transactions.listByUserId("user-a")).toHaveLength(0);
  });

  it("api_unavailable is also retryable (pending_confirmation)", async () => {
    const { app } = makeApp({
      adminWallet: ADMIN_RAW,
      tonClient: {
        async getTransactionByMessageHash() {
          return { kind: "error" };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("pending_confirmation");
    expect(body.reason).toBe("api_unavailable");
  });

  it("verification_failed (final) on destination mismatch — nothing settles", async () => {
    const { app, properties } = makeApp({
      adminWallet: ADMIN_RAW,
      tonClient: {
        async getTransactionByMessageHash() {
          return {
            kind: "found" as const,
            tx: txRow({
              outMessages: [
                {
                  destinationAddress:
                    "0:2222222222222222222222222222222222222222222222222222222222222222",
                  valueNano: AMOUNT_NANO,
                },
              ],
            }),
          };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("verification_failed");
    expect(body.reason).toBe("destination_mismatch");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2300);
  });

  it("repeated verify after settle is idempotent — no double bump", async () => {
    const { app, properties, transactions } = makeApp({
      adminWallet: ADMIN_RAW,
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 2,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    expect((await verifyAndSettle(app, "user-a", intentId)).status).toBe(200);
    const again = await verifyAndSettle(app, "user-a", intentId);
    expect(again.status).toBe(200);
    const body = (await again.json()) as { status: string };
    expect(body.status).toBe("settled");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2302);
    expect(await transactions.listByUserId("user-a")).toHaveLength(1);
  });

  it("user B cannot verify A's intent → 404", async () => {
    const { app } = makeApp({ adminWallet: ADMIN_RAW });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-b", intentId);
    expect(res.status).toBe(404);
  });

  it("pending intent (never confirmed) → 409", async () => {
    const { app } = makeApp({ adminWallet: ADMIN_RAW });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };

    const res = await verifyAndSettle(app, "user-a", intentId);
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("not_confirmed");
  });

  it("verify refuses to settle a txHash already consumed by another intent → 409 tx_hash_reused", async () => {
    const { app, intents, properties } = makeApp({ adminWallet: ADMIN_RAW });
    // Intent A settles with TX_HASH.
    const prepA = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId: intentA } = (await prepA.json()) as { intentId: string };
    await confirm(app, "user-a", intentA, { txHash: TX_HASH });
    expect((await verifyAndSettle(app, "user-a", intentA)).status).toBe(200);

    // Intent B was confirmed with the SAME hash before the confirm guard shipped (simulated by
    // writing the intent store directly) — verify-and-settle must still refuse to double-settle it.
    const prepB = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId: intentB } = (await prepB.json()) as { intentId: string };
    const claimed = await intents.markConfirmedIfPending(intentB, "user-a", new Date(), {
      txHash: TX_HASH,
    });
    expect(claimed.ok).toBe(true);

    const res = await verifyAndSettle(app, "user-a", intentB);
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("tx_hash_reused");
    // No second settlement.
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2301);
  });

  it("payer check (TON): tx from a different wallet than the session wallet → verification_failed", async () => {
    const OTHER = "0:6666666666666666666666666666666666666666666666666666666666666666";
    const { app, properties } = makeApp({
      adminWallet: ADMIN_RAW,
      userWallets: { "user-a": USER_WALLET_RAW },
      tonClient: {
        async getTransactionByMessageHash() {
          return { kind: "found" as const, tx: txRow({ accountAddress: OTHER }) };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("verification_failed");
    expect(body.reason).toBe("payer_mismatch");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2300);
  });

  it("payer check (TON): tx from the session wallet → settles", async () => {
    const { app, properties, transactions } = makeApp({
      adminWallet: ADMIN_RAW,
      userWallets: { "user-a": USER_WALLET_RAW },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe("settled");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2301);
    expect(await transactions.listByUserId("user-a")).toHaveLength(1);
  });
});

describe("POST /v1/buys/prepare — USDT (Jetton) rail", () => {
  const usdtConfig = {
    adminUsdtWallet: ADMIN_USDT_RAW,
    usdtJettonMaster: USDT_MASTER_RAW,
  };

  it("returns a jetton_transfer message from the buyer's jetton wallet to the admin wallet", async () => {
    const { app, intents } = makeApp({
      ...usdtConfig,
      userWallets: { "user-a": USER_WALLET_RAW },
      tonClient: {
        async getJettonWalletAddress() {
          return { kind: "found" as const, address: USER_JETTON_WALLET_RAW };
        },
      },
    });
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 5,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      intentId: string;
      currency: string;
      tonConnectMessages: Array<{ address: string; amount: string; payload: string }>;
    };
    expect(body.currency).toBe("USDT");
    expect(body.tonConnectMessages).toHaveLength(1);
    const msg = body.tonConnectMessages[0]!;
    // message originates from the BUYER's jetton wallet, gas is 0.1 TON, payload is a jetton_transfer
    expect(msg.address).toBe(USER_JETTON_WALLET_RAW);
    expect(msg.amount).toBe("100000000");
    expect(typeof msg.payload).toBe("string");
    expect(msg.payload.length).toBeGreaterThan(20);

    // intent records the USDT rail: admin recipient + expected jetton amount, no nanoTON
    const intent = await intents.getById(body.intentId);
    expect(intent?.currency).toBe("USDT");
    expect(intent?.destinationAddress).toBe(ADMIN_USDT_RAW);
    expect(intent?.expectedJettonAmount).toBe(USDT_AMOUNT);
    expect(intent?.expectedNanoTon).toBeNull();
  });

  it("409 when USDT is not configured", async () => {
    const { app } = makeApp({ userWallets: { "user-a": USER_WALLET_RAW } });
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("payment_method_unavailable");
  });

  it("409 when the buyer has no connected wallet", async () => {
    const { app } = makeApp(usdtConfig);
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("payment_method_unavailable");
  });

  it("502 when the buyer's jetton wallet cannot be resolved", async () => {
    const { app } = makeApp({
      ...usdtConfig,
      userWallets: { "user-a": USER_WALLET_RAW },
      tonClient: {
        async getJettonWalletAddress() {
          return { kind: "error" };
        },
      },
    });
    const res = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    expect(res.status).toBe(502);
  });
});

describe("POST /v1/buys/verify-and-settle — USDT (Jetton) rail", () => {
  const usdtConfig = {
    adminUsdtWallet: ADMIN_USDT_RAW,
    usdtJettonMaster: USDT_MASTER_RAW,
    userWallets: { "user-a": USER_WALLET_RAW },
    tonClient: {
      async getJettonWalletAddress() {
        return { kind: "found" as const, address: USER_JETTON_WALLET_RAW };
      },
    },
  };

  it("verifies the jetton transfer and settles: shares bump + USDT ledger row", async () => {
    const { app, properties, holdings, transactions, intents, audit } = makeApp({
      ...usdtConfig,
      tonClient: {
        ...usdtConfig.tonClient,
        async getJettonTransfer() {
          return { kind: "found" as const, transfer: jettonTransfer() };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 5,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; actualJettonAmount?: string };
    expect(body.status).toBe("settled");
    expect(body.actualJettonAmount).toBe(USDT_AMOUNT);

    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2305);
    const holding = await holdings.get("user-a", FUNDING);
    expect(holding?.sharesOwned).toBe(5);
    expect(holding?.avgCostUsd).toBe(PRICE);

    const txs = await transactions.listByUserId("user-a");
    expect(txs).toHaveLength(1);
    expect(txs[0]!.currency).toBe("USDT");
    expect(txs[0]!.tokenAmount).toBe(Number(USDT_AMOUNT));
    expect(txs[0]!.tonAmount).toBeNull();
    expect(txs[0]!.buyIntentId).toBe(intentId);
    expect(txs[0]!.feeUsd).toBe(BUY_FEE_USD);

    const intent = await intents.getById(intentId);
    expect(intent?.status).toBe("settled");
    const audits = await audit.listByResource("buy_intent", intentId);
    expect(audits.map((a) => a.action).sort()).toEqual(["buy.confirm", "buy.settle", "buy.verify"]);
  });

  it("verification_failed (final) on jetton_mismatch — nothing settles", async () => {
    const { app, properties } = makeApp({
      ...usdtConfig,
      tonClient: {
        ...usdtConfig.tonClient,
        async getJettonTransfer() {
          return {
            kind: "found" as const,
            transfer: jettonTransfer({
              jettonMasterAddress: "0:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            }),
          };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("verification_failed");
    expect(body.reason).toBe("jetton_mismatch");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2300);
  });

  it("pending_confirmation on jetton lookup api error — retryable", async () => {
    const { app } = makeApp({
      ...usdtConfig,
      tonClient: {
        ...usdtConfig.tonClient,
        async getJettonTransfer() {
          return { kind: "error" };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("pending_confirmation");
    expect(body.reason).toBe("api_unavailable");
  });

  it("payer check (USDT): transfer from a jetton wallet not derived from the session wallet → verification_failed", async () => {
    const OTHER_JETTON = "0:7777777777777777777777777777777777777777777777777777777777777777";
    const { app, properties } = makeApp({
      ...usdtConfig,
      tonClient: {
        ...usdtConfig.tonClient,
        async getJettonTransfer() {
          return { kind: "found" as const, transfer: jettonTransfer({ senderWalletAddress: OTHER_JETTON }) };
        },
      },
    });
    const prep = await prepare(app, "user-a", {
      propertyId: FUNDING,
      quantity: 1,
      priceUsdPerShare: PRICE,
      currency: "USDT",
    });
    const { intentId } = (await prep.json()) as { intentId: string };
    await confirm(app, "user-a", intentId, { txHash: TX_HASH });

    const res = await verifyAndSettle(app, "user-a", intentId);
    const body = (await res.json()) as { status: string; reason?: string };
    expect(body.status).toBe("verification_failed");
    expect(body.reason).toBe("payer_mismatch");
    expect((await properties.getById(FUNDING))!.sharesSold).toBe(2300);
  });
});
