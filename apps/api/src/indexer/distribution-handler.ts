import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { chainEvents } from "../db/schema/chain-events.js";
import { earningsEntries } from "../db/schema/earnings-entries.js";
import { properties } from "../db/schema/properties.js";
import { rentalDistributions } from "../db/schema/rental-distributions.js";
import type { Logger } from "../logger.js";

export type DistributionHandlerDeps = {
  db: Db;
  log: Logger;
};

export type DistributionHandlerResult = {
  handled: number;
  skipped: number;
  errors: string[];
};

export async function handleDistributionClaim(
  deps: DistributionHandlerDeps,
  eventId: string,
): Promise<DistributionHandlerResult> {
  const result: DistributionHandlerResult = { handled: 0, skipped: 0, errors: [] };

  try {
    const rows = await deps.db
      .select()
      .from(chainEvents)
      .where(
        and(
          eq(chainEvents.eventId, eventId),
          eq(chainEvents.eventType, "distribution_claim"),
        ),
      )
      .limit(1);

    const event = rows[0];
    if (!event) {
      result.skipped = 1;
      return result;
    }

    const propMatch = await deps.db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.distributionAddress, event.contractAddress))
      .limit(1);

    if (propMatch.length === 0) {
      result.skipped = 1;
      return result;
    }

    const rawData = event.rawData;
    const userId = rawData?.userId as string | undefined;
    const distributionId = rawData?.distributionId as string | undefined;

    if (!userId || !distributionId) {
      result.skipped = 1;
      return result;
    }

    const dist = await deps.db
      .select({ id: rentalDistributions.id, status: rentalDistributions.status })
      .from(rentalDistributions)
      .where(eq(rentalDistributions.id, distributionId))
      .limit(1);

    if (dist.length === 0) {
      result.skipped = 1;
      return result;
    }

    const entryRows = await deps.db
      .select({ id: earningsEntries.id, status: earningsEntries.status })
      .from(earningsEntries)
      .where(
        and(
          eq(earningsEntries.userId, userId),
          eq(earningsEntries.distributionId, distributionId),
        ),
      )
      .limit(1);

    if (entryRows.length === 0) {
      result.skipped = 1;
      return result;
    }

    const entry = entryRows[0]!;
    if (entry.status === "paid") {
      result.skipped = 1;
      return result;
    }

    const txHash = event.txHash;
    if (txHash.startsWith("simulated:")) {
      result.skipped = 1;
      return result;
    }

    await deps.db
      .update(earningsEntries)
      .set({
        status: "paid",
        txHash,
      })
      .where(
        and(
          eq(earningsEntries.id, entry.id),
          eq(earningsEntries.status, "pending"),
        ),
      );

    result.handled = 1;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    deps.log.error({ eventId, err: msg }, "distribution claim handler failed");
  }

  return result;
}
