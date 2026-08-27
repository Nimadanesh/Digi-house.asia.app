// File responsibility: NFT worker (Phase 6/10/11). Processes holding_nfts records through
// the lifecycle: pending → minting → minted → transferring → delivered (or failed).
// Idempotency: every transition is a guarded claim (claimForMint / claimForTransfer),
// so duplicate jobs and duplicate worker executions are no-ops. Mint/transfer failures
// mark the record failed (retryable via admin) — a purchase is NEVER affected.
// Recovery sweep: re-enqueues stale `pending` records (API restarted before enqueue, or
// lost jobs) and marks records stuck in `minting`/`transferring` past a timeout as failed
// (partially-completed mint/transfer — documented limitation, admin resolves manually).
import { Queue, Worker, type Job } from "bullmq";
import type { Redis } from "ioredis";
import IORedis from "ioredis";
import type { Logger } from "../logger.js";
import { sendOpsAlert, type OpsNotifyDeps } from "../notify/ops-alert.js";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { NftMinter, NftMintResult } from "./minter.js";
import type { NftQueueLike, NftStore, HoldingNftRecord } from "./nft-store.js";
import { buildNftMetadata } from "./metadata.js";

export const NFT_QUEUE_NAME = "digihouse-nfts";
export const NFT_JOB_NAME = "mintNft";
export const NFT_SWEEP_JOB_NAME = "sweepNfts";

export type NftJobData = { holdingNftId: string };
export type NftSweepJobData = { mode: "sweep" };

export type NftWorkerDeps = {
  nfts: NftStore;
  minter: NftMinter | null;
  properties: PropertyStore;
  holdings: HoldingStore;
  audit?: AuditStore | null;
  log: Logger;
  /** Mark failed only on the job's final attempt (transient errors get BullMQ retries). */
  maxAttempts: number;
};

export function createRedisConnection(redisUrl: string): Redis {
  return new IORedis(redisUrl, { maxRetriesPerRequest: null });
}

export function createNftQueue(redisUrl: string | undefined): Queue<NftJobData | NftSweepJobData> | null {
  if (!redisUrl?.trim()) return null;
  const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });
  return new Queue<NftJobData | NftSweepJobData>(NFT_QUEUE_NAME, { connection });
}

/** Register the recovery sweep as a repeatable job. */
export async function scheduleNftSweep(
  queue: Queue<NftJobData | NftSweepJobData>,
  everyMs: number,
): Promise<void> {
  await queue.add(
    NFT_SWEEP_JOB_NAME,
    { mode: "sweep" },
    {
      jobId: "sweep:nfts",
      repeat: { every: everyMs },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
  );
}

/** Enqueue one mint job (used by the settlement hook and the sweep). */
export async function enqueueNftMint(
  queue: NftQueueLike | null,
  holdingNftId: string,
): Promise<void> {
  if (!queue) return;
  await queue.add({ name: NFT_JOB_NAME, data: { holdingNftId } });
}

async function resolveMetadata(
  deps: NftWorkerDeps,
  record: HoldingNftRecord,
): Promise<{ metadataUrl: string; metadata: ReturnType<typeof buildNftMetadata> }> {
  const property = await deps.properties.getById(record.propertyId);
  const holding = await deps.holdings.get(record.userId, record.propertyId);
  const metadata = buildNftMetadata({
    nftId: record.id,
    propertyTitle: property?.title ?? record.propertyId,
    propertyLocation: property?.location ?? "",
    sharesOwned: holding?.sharesOwned ?? 0,
  });
  return {
    metadataUrl: record.metadataUrl ?? "",
    metadata,
  };
}

/**
 * Process one NFT record through the lifecycle. Idempotent: claiming is the atomic guard;
 * a record already claimed (minting/transferring) or terminal short-circuits immediately.
 * Returns the final status or null when the record was not claimable.
 */
export async function processNftJob(
  deps: NftWorkerDeps,
  holdingNftId: string,
  opts: { attemptsMade: number; attempts: number },
): Promise<string | null> {
  const claimed = await deps.nfts.claimForMint(holdingNftId);
  if (!claimed) {
    // Already claimed / terminal — duplicate execution, no-op.
    return deps.nfts.get(holdingNftId).then((r) => r?.status ?? null);
  }

  if (deps.audit) {
    await writeAuditEvent(deps.audit, {
      action: "nft.mint_started",
      actorType: "system",
      actorLabel: "nftWorker",
      resourceType: "holding_nft",
      resourceId: holdingNftId,
      summary: `NFT mint started for ${claimed.propertyId}`,
      payload: { nftId: holdingNftId, userId: claimed.userId, propertyId: claimed.propertyId },
      requestId: null,
    });
  }

  if (!deps.minter) {
    await deps.nfts.markFailed(holdingNftId, "minter_not_configured", "NFT minter is not configured (set NFT_MINTER_MODE=ton + credentials)");
    await auditFailed(deps, holdingNftId, "minter_not_configured");
    return "failed";
  }

  let phase: "mint" | "transfer" = "mint";
  try {
    const { metadataUrl, metadata } = await resolveMetadata(deps, claimed);

    // Check-before-mint reconciliation: a previous attempt may have persisted its EXPECTED
    // on-chain facts (nftItemId/mintTxHash) before broadcasting and then crashed after the
    // send but before markMinted (or failed during transfer and was retried). Verify whether
    // that item actually exists on-chain — if it does, ADOPT it instead of minting a duplicate.
    let minted: NftMintResult | undefined;
    const expectedIndex = claimed.nftItemId;
    if (expectedIndex != null) {
      const status = await deps.minter.itemStatus({
        collectionAddress: claimed.collectionAddress,
        itemIndex: expectedIndex,
      });
      if (status.exists && status.nftAddress) {
        const adopted = await deps.nfts.markMinted(holdingNftId, {
          nftItemId: expectedIndex,
          nftAddress: status.nftAddress,
          mintTxHash: claimed.mintTxHash ?? "recovered",
          metadataUrl,
        });
        if (!adopted) throw new Error("nft: minted transition not allowed");
        minted = {
          nftItemId: expectedIndex,
          nftAddress: status.nftAddress,
          mintTxHash: claimed.mintTxHash ?? "recovered",
        };
        if (deps.audit) {
          await writeAuditEvent(deps.audit, {
            action: "nft.mint_recovered",
            actorType: "system",
            actorLabel: "nftWorker",
            resourceType: "holding_nft",
            resourceId: holdingNftId,
            summary: `NFT mint reconciled on-chain — adopted existing item ${expectedIndex} instead of re-minting`,
            payload: { nftId: holdingNftId, nftItemId: expectedIndex, mintTxHash: minted.mintTxHash },
            requestId: null,
          });
        }
      }
    }
    if (!minted) {
      minted = await deps.minter.mint({
        destinationAddress: claimed.walletAddress,
        collectionAddress: claimed.collectionAddress,
        metadataUrl,
        metadata,
        // Persist the expected mint facts BEFORE broadcasting — closes the crash window:
        // if the process dies after the send but before markMinted, the retry reconciles
        // via itemStatus instead of double-minting. A failed write aborts the mint (nothing sent).
        beforeSend: (facts) =>
          deps.nfts
            .persistMintExpectation(holdingNftId, facts)
            .then((row) => {
              if (!row) throw new Error("nft: expectation persist failed");
            }),
      });
      const mintedRow = await deps.nfts.markMinted(holdingNftId, {
        nftItemId: minted.nftItemId,
        nftAddress: minted.nftAddress,
        mintTxHash: minted.mintTxHash,
        metadataUrl,
      });
      if (!mintedRow) throw new Error("nft: minted transition not allowed");
      if (deps.audit) {
        await writeAuditEvent(deps.audit, {
          action: "nft.minted",
          actorType: "system",
          actorLabel: "nftWorker",
          resourceType: "holding_nft",
          resourceId: holdingNftId,
          summary: `NFT minted for ${claimed.propertyId} (item ${minted.nftItemId})`,
          payload: { nftId: holdingNftId, nftItemId: minted.nftItemId, mintTxHash: minted.mintTxHash },
          requestId: null,
        });
      }
    }

    const transferring = await deps.nfts.claimForTransfer(holdingNftId);
    if (!transferring) throw new Error("nft: transfer claim not allowed");
    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "nft.transfer_started",
        actorType: "system",
        actorLabel: "nftWorker",
        resourceType: "holding_nft",
        resourceId: holdingNftId,
        summary: `NFT transfer started to user wallet`,
        payload: { nftId: holdingNftId, toAddress: claimed.walletAddress },
        requestId: null,
      });
    }

    phase = "transfer";
    const transferred = await deps.minter.transfer({
      nftAddress: minted.nftAddress,
      toAddress: claimed.walletAddress,
    });
    const delivered = await deps.nfts.markDelivered(holdingNftId, transferred.transferTxHash);
    if (!delivered) throw new Error("nft: delivered transition not allowed");
    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "nft.delivered",
        actorType: "system",
        actorLabel: "nftWorker",
        resourceType: "holding_nft",
        resourceId: holdingNftId,
        summary: `NFT delivered to user wallet`,
        payload: { nftId: holdingNftId, transferTxHash: transferred.transferTxHash },
        requestId: null,
      });
    }
    return "delivered";
  } catch (err) {
    const isFinal = opts.attemptsMade + 1 >= opts.attempts;
    const code = classifyNftError(err);
    if (isFinal) {
      await deps.nfts.markFailed(holdingNftId, code, String(err instanceof Error ? err.message : err));
      await auditFailed(deps, holdingNftId, code);
    } else {
      // Release the claim so the next BullMQ attempt can re-process: a failed MINT goes
      // back to pending, a failed TRANSFER goes back to minted (never re-mint).
      const released =
        phase === "mint"
          ? await deps.nfts.releaseMintForRetry(holdingNftId)
          : await deps.nfts.releaseTransferForRetry(holdingNftId);
      deps.log.warn(
        { nftId: holdingNftId, attemptsMade: opts.attemptsMade, code, released: !!released, err },
        "nft.job.transient_failure_will_retry",
      );
    }
    throw err;
  }
}

function classifyNftError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/invalid wallet/i.test(msg)) return "invalid_wallet";
  if (/timeout|timed out|etimedout|econnreset|socket/i.test(msg)) return "rpc_timeout";
  if (/not configured|minter/i.test(msg)) return "minter_not_configured";
  if (/balance|insufficient|fund/i.test(msg)) return "minter_insufficient_funds";
  return "mint_failed";
}

async function auditFailed(
  deps: { audit?: AuditStore | null },
  holdingNftId: string,
  code: string,
): Promise<void> {
  if (!deps.audit) return;
  await writeAuditEvent(deps.audit, {
    action: "nft.failed",
    actorType: "system",
    actorLabel: "nftWorker",
    resourceType: "holding_nft",
    resourceId: holdingNftId,
    summary: `NFT delivery failed (${code})`,
    payload: { nftId: holdingNftId, code },
    requestId: null,
  });
}

/**
 * Recovery sweep (run on the repeatable sweep job AND once at worker boot):
 *  - stale `pending` records → re-enqueue a mint job (survives API restart / lost jobs);
 *  - records stuck in `minting`/`transferring` past the active timeout → failed (timeout),
 *    admin resolves on-chain state manually before retrying (partially-completed edge case).
 * Returns counts for logging.
 */
export type NftSweepDeps = Pick<NftWorkerDeps, "nfts" | "log" | "audit">;

export async function runNftSweep(
  deps: NftSweepDeps,
  queue: NftQueueLike | null,
  opts: { stalePendingMs: number; staleActiveMs: number; now?: Date },
): Promise<{ reenqueued: number; timedOut: number }> {
  const now = opts.now ?? new Date();
  const reenqueued: string[] = [];
  for (const r of await deps.nfts.listStalePending(new Date(now.getTime() - opts.stalePendingMs))) {
    try {
      await enqueueNftMint(queue, r.id);
      reenqueued.push(r.id);
    } catch (err) {
      deps.log.warn({ nftId: r.id, err }, "nft.sweep.enqueue_failed");
    }
  }

  let timedOut = 0;
  const stuck = await deps.nfts.listAll();
  for (const r of stuck) {
    if (
      (r.status === "minting" || r.status === "transferring") &&
      r.updatedAt.getTime() < now.getTime() - opts.staleActiveMs
    ) {
      const failed = await deps.nfts.markFailed(r.id, "timeout", "Worker did not complete this step in time — verify on-chain state before retrying");
      if (failed) {
        timedOut++;
        await auditFailed(deps, r.id, "timeout");
      }
    }
  }

  if (reenqueued.length > 0) {
    deps.log.info({ reenqueued: reenqueued.length }, "nft.sweep.reenqueued_stale_pending");
  }
  return { reenqueued: reenqueued.length, timedOut };
}

export type NftWorkerHandle = {
  worker: Worker<NftJobData | NftSweepJobData>;
  close: () => Promise<void>;
};

export function startNftWorker(opts: {
  redisUrl: string;
  deps: NftWorkerDeps;
  log: Logger;
  stalePendingMs: number;
  staleActiveMs: number;
  queue: Queue<NftJobData | NftSweepJobData>;
  notify?: OpsNotifyDeps | null;
}): NftWorkerHandle {
  const connection = createRedisConnection(opts.redisUrl);

  const worker = new Worker<NftJobData | NftSweepJobData>(
    NFT_QUEUE_NAME,
    async (job: Job<NftJobData | NftSweepJobData>) => {
      if (job.name === NFT_JOB_NAME) {
        const data = job.data as NftJobData;
        const status = await processNftJob(opts.deps, data.holdingNftId, {
          attemptsMade: job.attemptsMade,
          attempts: opts.deps.maxAttempts,
        });
        opts.log.info({ jobId: job.id, holdingNftId: data.holdingNftId, status }, "nft.job.processed");
        return status;
      }
      if (job.name === NFT_SWEEP_JOB_NAME) {
        const r = await runNftSweep(
          opts.deps,
          { add: (j) => opts.queue.add(j.name, j.data) },
          {
            stalePendingMs: opts.stalePendingMs,
            staleActiveMs: opts.staleActiveMs,
          },
        );
        opts.log.info({ jobId: job.id, ...r }, "nft.sweep");
        return r;
      }
      opts.log.warn({ name: job.name }, "unknown nft job name");
      return null;
    },
    { connection, concurrency: 1 },
  );

  worker.on("failed", (job, err) => {
    opts.log.error({ jobId: job?.id, err }, "nft job failed");
    if (opts.notify) {
      void sendOpsAlert(opts.notify, {
        subject: `NFT job failed (${job?.id ?? "unknown"})`,
        details: { queue: NFT_QUEUE_NAME, name: job?.name },
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
