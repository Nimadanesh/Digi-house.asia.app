// File responsibility: settle an instant sell (§0.3). While the property is in its primary
// offering the platform is the counterparty: shares are bought back at list price − 7%
// (flat, §0.5), return to the primary supply, and the net is credited to the investing
// balance. One-way invariant: only valid in 'funding' — resale properties never go back.
import type { AuditStore } from "../audit/audit-store.js";
import type { Logger } from "../logger.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { TxStore } from "../buys/tx-store.js";
import type { ShareLockStore } from "../yield/lock-store.js";
import type { OrderStore } from "../orders/order-store.js";
import type { InstantSellRecord, InstantSellStore } from "./instant-sell-store.js";
import { computeFreeShares } from "./free-shares.js";

/** Flat instant-sell commission (§0.5) — 7% in basis points. */
export const INSTANT_SELL_FEE_BPS = 700;

export type SettleInstantSellDeps = {
  properties: PropertyStore;
  holdings: HoldingStore;
  locks?: ShareLockStore | null;
  orders?: OrderStore | null;
  balances: BalanceStore;
  transactions: TxStore;
  instantSells: InstantSellStore;
  log?: Logger;
  audit?: AuditStore | null;
};

export type InstantSellResult =
  | {
      ok: true;
      record: InstantSellRecord;
      sharesRemaining: number;
      freeSharesAfter: number;
    }
  | { ok: false; code: "not_found" | "invalid_phase" | "sale_paused" | "insufficient_free_shares" | "supply_conflict" };

export async function settleInstantSell(
  deps: SettleInstantSellDeps,
  input: { userId: string; propertyId: string; shares: number },
): Promise<InstantSellResult> {
  const listing = await deps.properties.getById(input.propertyId);
  if (!listing) return { ok: false, code: "not_found" };
  if (listing.salePaused) return { ok: false, code: "sale_paused" };
  // One-way invariant (PC-05): instant sell exists only in the primary phase.
  if (listing.status !== "funding") {
    return { ok: false, code: "invalid_phase" };
  }

  const free = await computeFreeShares(
    deps,
    input.userId,
    input.propertyId,
  );
  if (input.shares > free) {
    return { ok: false, code: "insufficient_free_shares" };
  }

  const grossUsd = input.shares * listing.sharePriceUsd;
  const feeUsd = Math.floor((grossUsd * INSTANT_SELL_FEE_BPS) / 10_000);
  const netUsd = grossUsd - feeUsd;

  // Race-safe supply return; guards both phase and floor (never negative).
  const decremented = await deps.properties.tryDecrementSharesSold(
    input.propertyId,
    input.shares,
  );
  if (!decremented) {
    return { ok: false, code: "supply_conflict" };
  }

  // Holding shrinks; avg cost unchanged (weighted average stays honest for the rest).
  // Zero-share holdings are deleted (CHECK shares_owned > 0).
  const holding = await deps.holdings.get(input.userId, input.propertyId);
  const newShares = (holding?.sharesOwned ?? 0) - input.shares;
  if (newShares > 0) {
    await deps.holdings.upsert({
      userId: input.userId,
      propertyId: input.propertyId,
      sharesOwned: newShares,
      avgCostUsd: holding!.avgCostUsd,
    });
  } else {
    await deps.holdings.delete(input.userId, input.propertyId);
  }

  const id = `isell_${crypto.randomUUID()}`;
  const txId = `tx_${id}`;
  await deps.balances.adjust(input.userId, { investingDelta: netUsd });
  await deps.transactions.insert({
    id: txId,
    userId: input.userId,
    kind: "instant_sell",
    propertyId: input.propertyId,
    shares: input.shares,
    amountUsd: netUsd,
    currency: "USDT",
    status: "success",
    feeUsd,
  });
  const record = await deps.instantSells.insert({
    id,
    userId: input.userId,
    propertyId: input.propertyId,
    shares: input.shares,
    sharePriceUsd: listing.sharePriceUsd,
    grossUsd,
    feeUsd,
    netUsd,
    transactionId: txId,
  });

  const fresh = await deps.properties.getById(input.propertyId);
  return {
    ok: true,
    record,
    sharesRemaining: fresh?.sharesRemaining ?? listing.sharesRemaining + input.shares,
    freeSharesAfter: Math.max(0, free - input.shares),
  };
}
