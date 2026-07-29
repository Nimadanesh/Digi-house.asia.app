import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { createDb, requireDatabaseUrl } from "./db/client.js";
import { createDbUserStore } from "./auth/user-store.js";
import { createDbPropertyStore } from "./marketplace/property-store.js";
import { createDbHoldingStore } from "./portfolio/holding-store.js";
import { createDbEarningsStore } from "./earnings/earnings-store.js";
import { createDbOrderStore } from "./orders/order-store.js";
import { createDbIntentStore } from "./buys/intent-store.js";
import { createDbTxStore } from "./buys/tx-store.js";
import { createDbAuditStore } from "./audit/audit-store.js";
import { createDbDocumentStore } from "./marketplace/document-store.js";
import { propertyDocuments } from "./db/schema/property-documents.js";
import { SEED_DOCUMENTS } from "./db/seed/documents-data.js";
import { loadEnv } from "./env.js";
import { createLogger } from "./logger.js";

const env = loadEnv();
const log = createLogger(env);

let users = null as ReturnType<typeof createDbUserStore> | null;
let properties = null as ReturnType<typeof createDbPropertyStore> | null;
let holdings = null as ReturnType<typeof createDbHoldingStore> | null;
let earnings = null as ReturnType<typeof createDbEarningsStore> | null;
let orders = null as ReturnType<typeof createDbOrderStore> | null;
let intents = null as ReturnType<typeof createDbIntentStore> | null;
let transactions = null as ReturnType<typeof createDbTxStore> | null;
let audit = null as ReturnType<typeof createDbAuditStore> | null;
let documents = null as ReturnType<typeof createDbDocumentStore> | null;
if (env.DATABASE_URL) {
  try {
    const db = createDb(requireDatabaseUrl({ DATABASE_URL: env.DATABASE_URL }));
    users = createDbUserStore(db);
    properties = createDbPropertyStore(db);
    holdings = createDbHoldingStore(db);
    earnings = createDbEarningsStore(db);
    orders = createDbOrderStore(db);
    intents = createDbIntentStore(db);
    transactions = createDbTxStore(db);
    audit = createDbAuditStore(db);
    documents = createDbDocumentStore(db);
    // Seed demo documents if table is empty
    if (env.NODE_ENV !== "production") {
      (async () => {
        const existing = await documents!.listByProperty("prop-marina-vista-4b");
        if (existing.length === 0) {
          for (const doc of SEED_DOCUMENTS) {
            await db.insert(propertyDocuments).values(doc);
          }
        }
      })().catch((err) => {
        log.warn({ err }, "failed to seed documents");
      });
    }
    log.info(
      "database stores enabled (users + properties + holdings + earnings + orders + buys + audit + documents)",
    );
  } catch (err) {
    log.fatal({ err }, "failed to init database");
    process.exit(1);
  }
} else {
  log.warn(
    "DATABASE_URL unset — authenticated API routes not mounted (healthz only)",
  );
}

const app = createApp({
  env,
  log,
  users,
  properties,
  holdings,
  earnings,
  orders,
  documents,
  intents,
  transactions,
  audit,
  orderRateLimitMax: env.ORDER_RATE_LIMIT_MAX,
  orderRateLimitWindowMs: env.ORDER_RATE_LIMIT_WINDOW_MS,
});

const server = serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  (info) => {
    log.info(
      { port: info.port, service: "digihouse-api" },
      `listening on http://localhost:${info.port}`,
    );
  },
);

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    log.fatal(
      { port: env.PORT },
      `Port ${env.PORT} is already in use. Set PORT=… or stop the other process.`,
    );
  } else {
    log.fatal({ err }, "server error");
  }
  process.exit(1);
});

function shutdown(signal: string) {
  log.info({ signal }, "shutting down");
  server.close(() => process.exit(0));
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
