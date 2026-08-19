import { Queue } from "bullmq";
import type { Redis } from "ioredis";
import IORedis from "ioredis";

export const PAYOUT_QUEUE_NAME = "digihouse-payouts";
export const PAYOUT_JOB_NAME = "tickPayout";

export type PayoutJobData =
  | { mode: "due" }
  | { mode: "distribution"; distributionId: string };

/**
 * Create BullMQ payout queue when REDIS_URL is set.
 * Returns null if redisUrl missing (API process stays healthy without Redis).
 */
export function createPayoutQueue(
  redisUrl: string | undefined,
): Queue<PayoutJobData> | null {
  if (!redisUrl?.trim()) return null;
  const connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  return new Queue<PayoutJobData>(PAYOUT_QUEUE_NAME, { connection });
}

export function createRedisConnection(
  redisUrl: string,
): Redis {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

/**
 * Register repeatable due-tick job. jobId stable for BullMQ dedupe.
 * Cadence = PAYOUT_TICK_MS (demo clock ≠ production Sunday — ADR-003).
 */
export async function schedulePayoutDueJobs(
  queue: Queue<PayoutJobData>,
  everyMs: number,
): Promise<void> {
  await queue.add(
    PAYOUT_JOB_NAME,
    { mode: "due" },
    {
      jobId: "tick:due",
      repeat: { every: everyMs },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}
