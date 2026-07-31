import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import type { MiddlewareHandler } from "hono";
import { HEALTH_OK, SERVICE_NAME } from "@digihouse/shared";
import type { ApiEnv } from "./env.js";
import IORedis from "ioredis";
import type { Logger } from "./logger.js";
import { createAdminRoutes } from "./routes/admin.js";
import { createDocumentRoutes } from "./routes/documents.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createMarketplaceRoutes } from "./routes/marketplace.js";
import { createPortfolioRoutes } from "./routes/portfolio.js";
import { createEarningsRoutes } from "./routes/earnings.js";
import { createOrderRoutes } from "./routes/orders.js";
import { createBuyRoutes } from "./routes/buys.js";
import { createTransactionRoutes } from "./routes/transactions.js";
import type { UserStore } from "./auth/user-store.js";
import type { PropertyStore } from "./marketplace/property-store.js";
import type { HoldingStore } from "./portfolio/holding-store.js";
import type { EarningsStore } from "./earnings/earnings-store.js";
import type { OrderStore } from "./orders/order-store.js";
import type { IntentStore } from "./buys/intent-store.js";
import type { TxStore } from "./buys/tx-store.js";
import { createTonApiTxClient } from "./ton/tonapi-client.js";
import type { TonTxClient } from "./ton/tx-client.js";
import type { AuditStore } from "./audit/audit-store.js";
import { createRedisTokenBucket } from "./lib/rate-limit-redis.js";
import { S3Signer } from "./lib/s3-sign.js";
import type { DocumentStore } from "./marketplace/document-store.js";
import { parseAllowlist } from "./launch/allowlist.js";

export type AppVariables = {
  requestId: string;
};

export type CreateAppOptions = {
  env: ApiEnv;
  log: Logger;
  users?: UserStore | null;
  properties?: PropertyStore | null;
  holdings?: HoldingStore | null;
  earnings?: EarningsStore | null;
  orders?: OrderStore | null;
  documents?: DocumentStore | null;
  intents?: IntentStore | null;
  transactions?: TxStore | null;
  audit?: AuditStore | null;
  /** Injected for tests; defaults to a live TonAPI client from TON_API_URL/TON_API_KEY. */
  tonTxClient?: TonTxClient | null;
  /** Injected for tests; defaults to the per-user in-memory prepare rate limiter. */
  prepareRateLimiter?: MiddlewareHandler | null;
  orderRateLimitMax?: number;
  orderRateLimitWindowMs?: number;
};

export function createApp(opts: CreateAppOptions) {
  const {
    env,
    log,
    users = null,
    properties = null,
    holdings = null,
    earnings = null,
    orders = null,
    documents = null,
    intents = null,
    transactions = null,
    audit = null,
    tonTxClient = null,
    prepareRateLimiter = null,
    orderRateLimitMax = 30,
    orderRateLimitWindowMs = 60_000,
  } = opts;
  const app = new Hono<{ Variables: AppVariables }>();

  const session = {
    secret: env.SESSION_SECRET,
    ttlSeconds: env.SESSION_TTL_SECONDS,
  };

  app.use(
    "*",
    cors({
      origin: env.CORS_ORIGIN,
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    }),
  );

  app.use("*", async (c, next) => {
    const started = performance.now();
    const requestId = crypto.randomUUID();
    c.set("requestId", requestId);
    await next();
    const ms = Math.round(performance.now() - started);
    log.info(
      {
        requestId,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms,
      },
      "request",
    );
  });

  app.onError((err, c) => {
    const requestId = c.get("requestId") ?? "unknown";
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    log.error({ err, requestId }, "unhandled error");
    return c.json(
      {
        code: "internal_error",
        message: "Internal server error",
        requestId,
      },
      500,
    );
  });

  app.get("/healthz", (c) => {
    return c.json({
      ok: HEALTH_OK,
      status: "ok" as const,
      service: SERVICE_NAME,
      ts: new Date().toISOString(),
      ...(env.SETTLEMENT_MODE
        ? { settlementMode: env.SETTLEMENT_MODE }
        : {}),
    });
  });

  let s3Signer: S3Signer | null = null;
  if (
    env.R2_ACCOUNT_ID?.trim() &&
    env.R2_ACCESS_KEY_ID?.trim() &&
    env.R2_SECRET_ACCESS_KEY?.trim() &&
    env.R2_BUCKET?.trim() &&
    env.R2_PUBLIC_BASE_URL?.trim()
  ) {
    s3Signer = new S3Signer({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
      publicBaseUrl: env.R2_PUBLIC_BASE_URL,
    });
  }

  // P4-04: Property documents
  if (documents && session && users) {
    app.route(
      "/",
      createDocumentRoutes({
        documents,
        session,
        users: users!,
        s3Signer,
        holdings,
      }),
    );
  }

  if (env.ADMIN_API_SECRET?.trim() && properties) {
    app.route(
      "/",
      createAdminRoutes({
        adminSecret: env.ADMIN_API_SECRET,
        properties,
        audit,
        s3Signer,
      }),
    );
  }

  if (users) {
    app.route(
      "/",
      createAuthRoutes({
        botToken: env.TELEGRAM_BOT_TOKEN,
        session,
        users,
        rateLimitMax: env.AUTH_RATE_LIMIT_MAX,
      }),
    );
  }

  if (properties) {
    app.route("/", createMarketplaceRoutes({ properties }));
  }

  if (users && holdings && properties) {
    app.route(
      "/",
      createPortfolioRoutes({
        session,
        users,
        holdings,
        properties,
        orders,
      }),
    );
  }

  if (users && earnings) {
    app.route(
      "/",
      createEarningsRoutes({
        session,
        users,
        earnings,
      }),
    );
  }

  let orderRateLimiter: MiddlewareHandler | undefined;
  if (env.REDIS_URL?.trim()) {
    const redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    orderRateLimiter = createRedisTokenBucket({
      redis,
      max: orderRateLimitMax,
      windowMs: orderRateLimitWindowMs,
      key: (c) => c.get("userId") as string,
      log,
    });
  }

  const allowlist = parseAllowlist(env.ALLOWLIST_WALLETS);
  const launchMode = env.LAUNCH_MODE;

  if (users && properties && orders) {
    app.route(
      "/",
      createOrderRoutes({
        session,
        users,
        properties,
        orders,
        holdings,
        audit,
        rateLimiter: orderRateLimiter,
        allowlist,
        launchMode,
      }),
    );
  }

  if (users && properties && intents && holdings && transactions) {
    const tonTxClientOrDefault =
      tonTxClient ??
      createTonApiTxClient({
        baseUrl: env.TON_API_URL,
        apiKey: env.TON_API_KEY,
      });
    app.route(
      "/",
      createBuyRoutes({
        session,
        users,
        properties,
        intents,
        holdings,
        transactions,
        tonTxClient: tonTxClientOrDefault,
        log,
        audit,
        adminTonWalletAddress: env.ADMIN_TON_WALLET_ADDRESS,
        tonRelayAddress: env.TON_RELAY_ADDRESS,
        adminUsdtWalletAddress: env.ADMIN_USDT_WALLET_ADDRESS,
        usdtJettonMasterAddress: env.USDT_JETTON_MASTER_ADDRESS,
        buyStubNanoTon: env.BUY_STUB_NANOTON,
        tonUsdPriceCents: env.TON_USD_PRICE_CENTS,
        buyIntentTtlSeconds: env.BUY_INTENT_TTL_SECONDS,
        allowlist,
        launchMode,
        prepareRateLimiter: prepareRateLimiter ?? undefined,
      }),
    );
  }

  if (transactions && users) {
    app.route(
      "/",
      createTransactionRoutes({
        session,
        users: users!,
        transactions,
      }),
    );
  }

  return app;
}
