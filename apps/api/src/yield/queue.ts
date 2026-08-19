import { Queue, Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import IORedis from "ioredis";
import type { Logger } from "../logger.js";
import { sendOpsAlert, type OpsNotifyDeps } from "../notify/ops-alert.js";
import { tickYieldEngine, type YieldEngineDeps } from "./tick-yield.js";

export const YIELD_QUEUE_NAME = "digihouse-yield";
export const YIELD_JOB_NAME = "tickYield";

export type YieldJobData = { mode: "tick" };

export function createRedisConnection(redisUrl: string): Redis {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

/** Create BullMQ yield queue when REDIS_URL is set; null keeps the API healthy without Redis. */
export function createYieldQueue(
  redisUrl: string | undefined,
): Queue<YieldJobData> | null {
  if (!redisUrl?.trim()) return null;
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return new Queue<YieldJobData>(YIELD_QUEUE_NAME, { connection });
}

/** Register the repeatable engine tick (mature → accrue → pay). */
export async function scheduleYieldTickJobs(
  queue: Queue<YieldJobData>,
  everyMs: number,
): Promise<void> {
  await queue.add(
    YIELD_JOB_NAME,
    { mode: "tick" },
    {
      jobId: "tick:yield",
      repeat: { every: everyMs },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}

export type YieldWorkerHandle = {
  worker: Worker<YieldJobData>;
  close: () => Promise<void>;
};

/**
 * BullMQ worker concurrency=1 (avoid payout races; same convention as payouts).
 * Each tick: mature due locks → accrue daily rows → settle due payouts.
 */
export function startYieldWorker(opts: {
  redisUrl: string;
  deps: YieldEngineDeps;
  unlockMaturationMs: number;
  log: Logger;
  /** PF-05: optional ops Telegram alerting on failed ticks. */
  notify?: OpsNotifyDeps | null;
}): YieldWorkerHandle {
  const connection = createRedisConnection(opts.redisUrl);

  const worker = new Worker<YieldJobData>(
    YIELD_QUEUE_NAME,
    async (job: Job<YieldJobData>) => {
      if (job.name !== YIELD_JOB_NAME) {
        opts.log.warn({ name: job.name }, "unknown yield job name");
        return;
      }
      const r = await tickYieldEngine(opts.deps, opts.unlockMaturationMs);
      opts.log.info(
        {
          jobId: job.id,
          matured: r.matured.length,
          accrualRows: r.accrual.rowsInserted,
          payouts: r.payouts.length,
        },
        "tickYield",
      );
      return r;
    },
    { connection, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    opts.log.error({ jobId: job?.id, err }, "yield job failed");
    if (opts.notify) {
      void sendOpsAlert(opts.notify, {
        subject: `Yield job failed (${job?.id ?? "unknown"})`,
        details: { queue: YIELD_QUEUE_NAME, name: job?.name },
        err,
      });
    }
  });

  return {
    worker,
    close: async () => {
      await worker.close();
      connection.disconnect();
    },
  };
}
