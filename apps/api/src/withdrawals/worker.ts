import { Queue, Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import IORedis from "ioredis";
import type { Logger } from "../logger.js";
import { sendOpsAlert, type OpsNotifyDeps } from "../notify/ops-alert.js";
import type { WithdrawalInstallmentStore } from "./installment-store.js";

export const WITHDRAWAL_QUEUE_NAME = "digihouse-withdrawals";
export const WITHDRAWAL_JOB_NAME = "tickWithdrawals";

export type WithdrawalJobData = { mode: "tick" };

export function createRedisConnection(redisUrl: string): Redis {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

/** Create BullMQ withdrawal queue when REDIS_URL is set; null keeps the API healthy without Redis. */
export function createWithdrawalQueue(
  redisUrl: string | undefined,
): Queue<WithdrawalJobData> | null {
  if (!redisUrl?.trim()) return null;
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return new Queue<WithdrawalJobData>(WITHDRAWAL_QUEUE_NAME, { connection });
}

/** Register the repeatable due-marking tick (pending → due, weekly installments). */
export async function scheduleWithdrawalTickJobs(
  queue: Queue<WithdrawalJobData>,
  everyMs: number,
): Promise<void> {
  await queue.add(
    WITHDRAWAL_JOB_NAME,
    { mode: "tick" },
    {
      jobId: "tick:withdrawals",
      repeat: { every: everyMs },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}

export type WithdrawalWorkerHandle = {
  worker: Worker<WithdrawalJobData>;
  close: () => Promise<void>;
};

/**
 * BullMQ worker concurrency=1 (same convention as payouts/yield). Each tick marks
 * pending installments past their due date as `due` (only for approved withdrawals,
 * guarded + idempotent in the store). Fulfillment itself stays admin-driven:
 * mark-paid per installment with the USDT tx hash.
 */
export function startWithdrawalWorker(opts: {
  redisUrl: string;
  installments: WithdrawalInstallmentStore;
  log: Logger;
  /** PF-05: optional ops Telegram alerting on failed ticks. */
  notify?: OpsNotifyDeps | null;
}): WithdrawalWorkerHandle {
  const connection = createRedisConnection(opts.redisUrl);

  const worker = new Worker<WithdrawalJobData>(
    WITHDRAWAL_QUEUE_NAME,
    async (job: Job<WithdrawalJobData>) => {
      if (job.name !== WITHDRAWAL_JOB_NAME) {
        opts.log.warn({ name: job.name }, "unknown withdrawal job name");
        return;
      }
      const marked = await opts.installments.markDue(new Date());
      opts.log.info({ jobId: job.id, markedDue: marked }, "tickWithdrawals");
      return { markedDue: marked };
    },
    { connection, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    opts.log.error({ jobId: job?.id, err }, "withdrawal job failed");
    if (opts.notify) {
      void sendOpsAlert(opts.notify, {
        subject: `Withdrawal job failed (${job?.id ?? "unknown"})`,
        details: { queue: WITHDRAWAL_QUEUE_NAME, name: job?.name },
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
