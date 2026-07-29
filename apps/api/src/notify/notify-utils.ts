import type { Logger } from "../logger.js";
import type { EarningsStore } from "../earnings/earnings-store.js";
import { formatWeekOf } from "../earnings/map-earnings.js";
import { sendTelegramMessage } from "./telegram-notify.js";
import { buildEarningsPaidMessage } from "./earnings-paid-message.js";

export type NotifyDeps = {
  earnings: EarningsStore;
  botToken: string;
  settlementMode: string;
  log: Logger;
  getPropertyTitle: (propertyId: string) => Promise<string>;
};

/**
 * Attempt to notify every user whose earnings entry was just paid.
 *
 * At-most-once per entry (checks `notifiedAt` before sending).
 * Fail-open: never throws. Warns on individual failures.
 * Returns count of successfully notified entries.
 */
export async function notifyUsersForDistribution(input: {
  entryIds: string[];
  distributionId: string;
  deps: NotifyDeps;
}): Promise<number> {
  const { entryIds, deps } = input;
  let notifiedCount = 0;

  for (const entryId of entryIds) {
    try {
      const already = await deps.earnings.wasNotified(entryId);
      if (already) continue;

      const entry = await deps.earnings.getEntry(entryId);
      if (!entry) {
        deps.log.warn({ entryId }, "notify: entry not found");
        continue;
      }

      const title = await deps.getPropertyTitle(entry.propertyId).catch(() => {
        deps.log.warn(
          { propertyId: entry.propertyId, entryId },
          "notify: property title not found, using id",
        );
        return entry.propertyId;
      });

      const text = buildEarningsPaidMessage({
        amountUsd: entry.amountUsd,
        propertyTitle: title,
        weekOf: formatWeekOf(entry.weekOf),
        settlementMode: deps.settlementMode,
      });

      const chatId = entry.userId;
      const result = await sendTelegramMessage({
        botToken: deps.botToken,
        chatId,
        text,
      });

      if (result.ok) {
        await deps.earnings.markNotified(entryId);
        notifiedCount++;
      } else {
        deps.log.warn(
          { entryId, chatId, error: result.error },
          "notify: telegram send failed",
        );
      }
    } catch (err) {
      deps.log.warn({ entryId, err }, "notify: unexpected error");
    }
  }

  return notifiedCount;
}
