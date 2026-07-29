import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { holdings } from "../db/schema/holdings.js";
import { chainEvents } from "../db/schema/chain-events.js";
import { properties } from "../db/schema/properties.js";
import type { Logger } from "../logger.js";

export type JettonHandlerDeps = {
  db: Db;
  log: Logger;
};

export type JettonHandlerResult = {
  handled: number;
  skipped: number;
  errors: string[];
};

export async function handleJettonTransfer(
  deps: JettonHandlerDeps,
  eventId: string,
): Promise<JettonHandlerResult> {
  const result: JettonHandlerResult = { handled: 0, skipped: 0, errors: [] };

  try {
    const rows = await deps.db
      .select()
      .from(chainEvents)
      .where(
        and(
          eq(chainEvents.eventId, eventId),
          eq(chainEvents.eventType, "jetton_transfer"),
        ),
      )
      .limit(1);

    const event = rows[0];
    if (!event) {
      result.skipped = 1;
      return result;
    }

    const masterMatch = await deps.db
      .select({ id: properties.id })
      .from(properties)
      .where(eq(properties.onchainMaster, event.contractAddress))
      .limit(1);

    if (masterMatch.length === 0) {
      result.skipped = 1;
      return result;
    }

    const propertyId = masterMatch[0]!.id;
    const toAddress = event.toAddress;
    const amount = event.amount;

    if (!toAddress || !amount) {
      result.skipped = 1;
      return result;
    }

    const nanoAmount = BigInt(amount);

    const holderRow = await deps.db
      .select()
      .from(holdings)
      .where(
        and(
          eq(holdings.propertyId, propertyId),
          eq(holdings.jettonWalletAddress, toAddress),
        ),
      )
      .limit(1);

    if (holderRow.length > 0) {
      await deps.db
        .update(holdings)
        .set({
          jettonBalance: Number(nanoAmount),
          sharesOwned: Number(nanoAmount / BigInt(10 ** 9)),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(holdings.propertyId, propertyId),
            eq(holdings.jettonWalletAddress, toAddress),
          ),
        );
      result.handled = 1;
    } else {
      result.skipped = 1;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(msg);
    deps.log.error({ eventId, err: msg }, "jetton transfer handler failed");
  }

  return result;
}
