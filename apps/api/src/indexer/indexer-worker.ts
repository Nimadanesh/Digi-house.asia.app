import type { Db } from "../db/client.js";
import type { Logger } from "../logger.js";
import type { CursorStore } from "./cursor-store.js";
import type { EventStore } from "./event-store.js";
import type { TonClient } from "./ton-client.js";
import { handleJettonTransfer } from "./jetton-handler.js";
import { handleDistributionClaim } from "./distribution-handler.js";

export type IndexerDeps = {
  db: Db;
  events: EventStore;
  cursors: CursorStore;
  ton: TonClient;
  log: Logger;
};

export type IndexerWorkerHandle = {
  stop: () => void;
};

const MAX_RETRIES = 5;

export function startIndexer(
  deps: IndexerDeps,
  pollMs: number,
): IndexerWorkerHandle {
  let running = true;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (!running) return;

    try {
      await pollChain(deps);
      await processEvents(deps);
    } catch (err) {
      deps.log.error({ err }, "indexer tick failed");
    }

    if (running) {
      timer = setTimeout(tick, pollMs);
    }
  }

  timer = setTimeout(tick, 0);
  deps.log.info({ pollMs }, "indexer started");

  return {
    stop: () => {
      running = false;
      if (timer) clearTimeout(timer);
      deps.log.info("indexer stopped");
    },
  };
}

async function pollChain(deps: IndexerDeps): Promise<void> {
  const props = await deps.db.query.properties.findMany({
    columns: {
      id: true,
      onchainMaster: true,
      distributionAddress: true,
    },
  });

  for (const prop of props) {
    if (prop.onchainMaster) {
      await pollJettonTransfers(deps, prop.id, prop.onchainMaster);
    }
    if (prop.distributionAddress) {
      await pollDistributionClaims(deps, prop.id, prop.distributionAddress);
    }
  }
}

async function pollJettonTransfers(
  deps: IndexerDeps,
  propertyId: string,
  masterAddress: string,
): Promise<void> {
  try {
    const cursor = await deps.cursors.getOrInit(masterAddress, "jetton_transfer");
    const result = await deps.ton.fetchJettonTransfers(masterAddress, cursor.cursor);

    for (const ev of result.events) {
      const blockLt = Number(ev.block_lt);
      const logicalTime = ev.logical_time ? Number(ev.logical_time) : null;
      const eventId = `jetton:${ev.tx_hash}:${logicalTime ?? blockLt}`;
      const inserted = await deps.events.tryInsert({
        eventId,
        contractAddress: masterAddress,
        eventType: "jetton_transfer",
        blockLt,
        txHash: ev.tx_hash,
        logicalTime,
        fromAddress: ev.from,
        toAddress: ev.to,
        amount: ev.amount,
        rawData: { jetton_master: ev.jetton_master },
      });
      if (inserted === "inserted") {
        deps.log.debug({ eventId, type: "jetton_transfer" }, "new chain event");
      }
    }

    if (result.nextCursor !== null) {
      const last = result.events.length > 0 ? result.events[result.events.length - 1]! : null;
      await deps.cursors.advance(
        masterAddress,
        "jetton_transfer",
        result.nextCursor,
        last ? Number(last.block_lt) : 0,
        last ? last.tx_hash : "",
      );
    }
  } catch (err) {
    deps.log.error({ propertyId, masterAddress, err }, "jetton poll failed");
  }
}

async function pollDistributionClaims(
  deps: IndexerDeps,
  propertyId: string,
  distributionAddress: string,
): Promise<void> {
  try {
    const cursor = await deps.cursors.getOrInit(distributionAddress, "distribution_claim");
    const result = await deps.ton.fetchDistributionClaims(distributionAddress, cursor.cursor);

    for (const ev of result.events) {
      const blockLt = Number(ev.block_lt);
      const logicalTime = ev.logical_time ? Number(ev.logical_time) : null;
      const eventId = `dist:${ev.tx_hash}:${logicalTime ?? blockLt}`;
      const inserted = await deps.events.tryInsert({
        eventId,
        contractAddress: distributionAddress,
        eventType: "distribution_claim",
        blockLt,
        txHash: ev.tx_hash,
        logicalTime,
        fromAddress: ev.claimer,
        toAddress: null,
        amount: ev.amount_nano,
        rawData: {
          claimer: ev.claimer,
          property_id: ev.property_id,
          week_of: ev.week_of,
        },
      });
      if (inserted === "inserted") {
        deps.log.debug({ eventId, type: "distribution_claim" }, "new chain event");
      }
    }

    if (result.nextCursor !== null) {
      const last = result.events.length > 0 ? result.events[result.events.length - 1]! : null;
      await deps.cursors.advance(
        distributionAddress,
        "distribution_claim",
        result.nextCursor,
        last ? Number(last.block_lt) : 0,
        last ? last.tx_hash : "",
      );
    }
  } catch (err) {
    deps.log.error({ propertyId, distributionAddress, err }, "distribution poll failed");
  }
}

async function processEvents(deps: IndexerDeps): Promise<void> {
  const batch = await deps.events.claimBatch(10);

  for (const event of batch) {
    try {
      let result:
        | { handled: number; skipped: number; errors: string[] }
        | null = null;

      if (event.eventType === "jetton_transfer") {
        result = await handleJettonTransfer({ db: deps.db, log: deps.log }, event.eventId);
      } else if (event.eventType === "distribution_claim") {
        result = await handleDistributionClaim({ db: deps.db, log: deps.log }, event.eventId);
      }

      if (result) {
        if (result.errors.length > 0) {
          if (event.retryCount >= MAX_RETRIES) {
            await deps.events.markDead(event.eventId, result.errors.join("; "));
          } else {
            await deps.events.markFailed(event.eventId, result.errors.join("; "));
          }
        } else {
          await deps.events.markDone(event.eventId);
        }
      } else {
        await deps.events.markDone(event.eventId);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (event.retryCount >= MAX_RETRIES) {
        await deps.events.markDead(event.eventId, msg);
      } else {
        await deps.events.markFailed(event.eventId, msg);
      }
    }
  }
}
