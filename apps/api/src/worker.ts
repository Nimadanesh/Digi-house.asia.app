/**
 * DigiHouse worker process — payout (P1-13) + indexer (P3-01).
 *
 *   REDIS_URL=redis://localhost:6379 PAYOUT_WORKER_ENABLED=true npm run worker -w @digihouse/api
 *   INDEXER_ENABLED=true TON_API_URL=https://testnet.tonapi.io npm run worker -w @digihouse/api
 *
 * Kill switches: PAYOUT_WORKER_ENABLED=false (default) / INDEXER_ENABLED=false (default).
 * When both false the process exits 0.
 */
import { createDbAuditStore } from "./audit/audit-store.js";
import { createDb, requireDatabaseUrl } from "./db/client.js";
import { createDbEarningsStore } from "./earnings/earnings-store.js";
import { loadEnv } from "./env.js";
import { createDbCursorStore } from "./indexer/cursor-store.js";
import { createDbEventStore } from "./indexer/event-store.js";
import { startIndexer } from "./indexer/indexer-worker.js";
import { createTonClient } from "./indexer/ton-client.js";
import { createLogger } from "./logger.js";
import { createDbPropertyStore } from "./marketplace/property-store.js";
import type { NotifyDeps } from "./notify/notify-utils.js";
import { createDbDistributionStore } from "./payouts/distribution-store.js";
import { createDbPayoutTickStore } from "./payouts/payout-tick-store.js";
import {
  createPayoutQueue,
  schedulePayoutDueJobs,
} from "./payouts/queue.js";
import { startPayoutWorker } from "./payouts/worker.js";

const env = loadEnv();
const log = createLogger(env);

async function main() {
  const hasPayoutWorker = env.PAYOUT_WORKER_ENABLED && env.REDIS_URL?.trim();
  const hasIndexer = env.INDEXER_ENABLED && env.DATABASE_URL?.trim();

  if (!hasPayoutWorker && !hasIndexer) {
    log.info(
      "PAYOUT_WORKER_ENABLED=false and INDEXER_ENABLED=false — no workers started",
    );
    process.exit(0);
  }

  if (!env.DATABASE_URL?.trim()) {
    log.fatal("DATABASE_URL required for worker process");
    process.exit(1);
  }

  const db = createDb(requireDatabaseUrl({ DATABASE_URL: env.DATABASE_URL }));

  const shutdownHandlers: Array<() => Promise<void>> = [];

  if (hasPayoutWorker) {
    const earnings = createDbEarningsStore(db);
    const properties = createDbPropertyStore(db);

    let notify: NotifyDeps | null = null;
    if (
      env.NOTIFY_EARNINGS_PAID &&
      env.TELEGRAM_BOT_TOKEN?.trim()
    ) {
      notify = {
        earnings,
        botToken: env.TELEGRAM_BOT_TOKEN,
        settlementMode: env.SETTLEMENT_MODE ?? "hybrid",
        log,
        getPropertyTitle: async (propertyId: string) => {
          const prop = await properties.getById(propertyId);
          return prop?.title ?? propertyId;
        },
      };
    }

    const deps = {
      distributions: createDbDistributionStore(db),
      earnings,
      ticks: createDbPayoutTickStore(db),
      properties,
      audit: createDbAuditStore(db),
      notify,
    };

    const queue = createPayoutQueue(env.REDIS_URL);
    if (!queue) {
      log.fatal("failed to create payout queue");
      process.exit(1);
    }

    await schedulePayoutDueJobs(queue, env.PAYOUT_TICK_MS);
    log.info(
      { everyMs: env.PAYOUT_TICK_MS, queue: "digihouse-payouts" },
      "scheduled repeatable tickPayout (demo cadence)",
    );

    const payoutHandle = startPayoutWorker({
      redisUrl: env.REDIS_URL!,
      deps,
      log,
    });
    log.info("payout worker listening");

    shutdownHandlers.push(async () => {
      await payoutHandle.close();
      await queue.close();
    });
  }

  if (hasIndexer) {
    const tonClient = createTonClient({
      baseUrl: env.TON_API_URL,
      apiKey: env.TON_API_KEY,
    });

    const indexerHandle = startIndexer(
      {
        db,
        events: createDbEventStore(db),
        cursors: createDbCursorStore(db),
        ton: tonClient,
        log,
      },
      env.INDEXER_POLL_MS,
    );
    log.info(
      { pollMs: env.INDEXER_POLL_MS, tonApi: env.TON_API_URL },
      "indexer started",
    );

    shutdownHandlers.push(async () => {
      indexerHandle.stop();
    });
  }

  async function shutdown(signal: string) {
    log.info({ signal }, "worker shutting down");
    for (const handler of shutdownHandlers) {
      try {
        await handler();
      } catch (err) {
        log.error({ err }, "shutdown handler error");
      }
    }
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.fatal({ err }, "worker failed");
  process.exit(1);
});
