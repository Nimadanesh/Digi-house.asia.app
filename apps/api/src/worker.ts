/**
 * DigiHouse payout worker process (P1-13).
 *
 *   REDIS_URL=redis://localhost:6379 PAYOUT_WORKER_ENABLED=true npm run worker -w @digihouse/api
 *
 * Requires DATABASE_URL + migrations (incl. 0007_payout_ticks).
 * Kill switch: PAYOUT_WORKER_ENABLED=false (default) — process exits 0.
 * Demo cadence PAYOUT_TICK_MS ≠ production Friday calendar (ADR-003).
 */
import { createDbAuditStore } from "./audit/audit-store.js";
import { createDb, requireDatabaseUrl } from "./db/client.js";
import { createDbEarningsStore } from "./earnings/earnings-store.js";
import { loadEnv } from "./env.js";
import { createLogger } from "./logger.js";
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
  if (!env.PAYOUT_WORKER_ENABLED) {
    log.info(
      "PAYOUT_WORKER_ENABLED=false — payout worker not started (kill switch)",
    );
    process.exit(0);
  }

  if (!env.REDIS_URL?.trim()) {
    log.fatal("REDIS_URL required when PAYOUT_WORKER_ENABLED=true");
    process.exit(1);
  }

  if (!env.DATABASE_URL?.trim()) {
    log.fatal("DATABASE_URL required for payout worker");
    process.exit(1);
  }

  const db = createDb(requireDatabaseUrl({ DATABASE_URL: env.DATABASE_URL }));
  const deps = {
    distributions: createDbDistributionStore(db),
    earnings: createDbEarningsStore(db),
    ticks: createDbPayoutTickStore(db),
    audit: createDbAuditStore(db),
  };

  const queue = createPayoutQueue(env.REDIS_URL);
  if (!queue) {
    log.fatal("failed to create payout queue");
    process.exit(1);
  }
  const payoutQueue = queue;

  await schedulePayoutDueJobs(payoutQueue, env.PAYOUT_TICK_MS);
  log.info(
    { everyMs: env.PAYOUT_TICK_MS, queue: "digihouse-payouts" },
    "scheduled repeatable tickPayout (demo cadence)",
  );

  const handle = startPayoutWorker({
    redisUrl: env.REDIS_URL,
    deps,
    log,
  });
  log.info("payout worker listening");

  async function shutdown(signal: string) {
    log.info({ signal }, "worker shutting down");
    await handle.close();
    await payoutQueue.close();
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.fatal({ err }, "worker failed");
  process.exit(1);
});
