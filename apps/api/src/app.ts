import { Hono } from "hono";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { HEALTH_OK, SERVICE_NAME } from "@digihouse/shared";
import type { ApiEnv } from "./env.js";
import type { Logger } from "./logger.js";
import { createAuthRoutes } from "./routes/auth.js";
import { createMarketplaceRoutes } from "./routes/marketplace.js";
import { createPortfolioRoutes } from "./routes/portfolio.js";
import { createEarningsRoutes } from "./routes/earnings.js";
import { createOrderRoutes } from "./routes/orders.js";
import { createBuyRoutes } from "./routes/buys.js";
import type { UserStore } from "./auth/user-store.js";
import type { PropertyStore } from "./marketplace/property-store.js";
import type { HoldingStore } from "./portfolio/holding-store.js";
import type { EarningsStore } from "./earnings/earnings-store.js";
import type { OrderStore } from "./orders/order-store.js";
import type { IntentStore } from "./buys/intent-store.js";
import type { TxStore } from "./buys/tx-store.js";
import type { AuditStore } from "./audit/audit-store.js";

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
  intents?: IntentStore | null;
  transactions?: TxStore | null;
  audit?: AuditStore | null;
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
    intents = null,
    transactions = null,
    audit = null,
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

  if (users) {
    app.route(
      "/",
      createAuthRoutes({
        botToken: env.TELEGRAM_BOT_TOKEN,
        session,
        users,
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
      }),
    );
  }

  if (users && properties && holdings && intents && transactions) {
    app.route(
      "/",
      createBuyRoutes({
        session,
        users,
        properties,
        holdings,
        intents,
        transactions,
        audit,
        tonRelayAddress: env.TON_RELAY_ADDRESS,
        buyStubNanoTon: env.BUY_STUB_NANOTON,
        buyIntentTtlSeconds: env.BUY_INTENT_TTL_SECONDS,
      }),
    );
  }

  return app;
}
