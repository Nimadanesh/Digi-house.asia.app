import { Worker, type Job } from "bullmq";
import type { Logger } from "../logger.js";
import { sendOpsAlert, type OpsNotifyDeps } from "../notify/ops-alert.js";
import {
  PAYOUT_JOB_NAME,
  PAYOUT_QUEUE_NAME,
  createRedisConnection,
  type PayoutJobData,
} from "./queue.js";
import {
  tickPayout,
  tickPayoutDue,
  type TickPayoutDeps,
} from "./tick-payout.js";

export type PayoutWorkerHandle = {
  worker: Worker<PayoutJobData>;
  close: () => Promise<void>;
};

/**
 * BullMQ worker concurrency=1 for payouts (avoid races).
 * Hybrid only — never moves TON (ADR-001).
 */
export function startPayoutWorker(opts: {
  redisUrl: string;
  deps: TickPayoutDeps;
  log: Logger;
  /** PF-05: optional ops Telegram alerting on failed payout jobs. */
  notify?: OpsNotifyDeps | null;
}): PayoutWorkerHandle {
  const connection = createRedisConnection(opts.redisUrl);

  const worker = new Worker<PayoutJobData>(
    PAYOUT_QUEUE_NAME,
    async (job: Job<PayoutJobData>) => {
      if (job.name !== PAYOUT_JOB_NAME) {
        opts.log.warn({ name: job.name }, "unknown payout job name");
        return;
      }
      const data = job.data;
      if (data.mode === "distribution") {
        const r = await tickPayout(opts.deps, data.distributionId);
        opts.log.info({ jobId: job.id, result: r }, "tickPayout distribution");
        return r;
      }
      const results = await tickPayoutDue(opts.deps);
      opts.log.info(
        {
          jobId: job.id,
          count: results.length,
          paid: results.reduce((s, x) => s + x.paidEntries, 0),
        },
        "tickPayout due",
      );
      // P1-14: audit_events can consume results[].entryIds
      return results;
    },
    {
      connection,
      concurrency: 1,
    },
  );

  worker.on("failed", (job, err) => {
    opts.log.error({ jobId: job?.id, err }, "payout job failed");
    if (opts.notify) {
      void sendOpsAlert(opts.notify, {
        subject: `Payout job failed (${job?.id ?? "unknown"})`,
        details: { queue: PAYOUT_QUEUE_NAME, name: job?.name },
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
