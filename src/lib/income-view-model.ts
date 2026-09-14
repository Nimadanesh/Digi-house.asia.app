// File responsibility: Slice I income view-model — explicit economic states over the
// existing repo contracts (earnings ledger, lock accrual, withdrawal pipeline,
// holdings, open orders). Pure and deterministic: fixtures in, states out.
// - Every state derives from a DISTINCT source; states are never merged.
// - Missing data yields `pending` (unknown) or `none` (known absence) — never a
//   fabricated $0. `$0` appears only as a real computed sum.
// - Money: integer minor units (cents). No React, no IO, no new economics.
import type { EarningsEntry } from "@/types/earnings";
import type { ShareLock } from "@/types/lock";
import type { Withdrawal } from "@/types/withdrawal";
import type { Holding } from "@/types/position";
import type { Listing } from "@/types/property";
import type { Order } from "@/types/order";
import { gainLossVsAcquisition } from "./estate-share-model";

/** One honest amount: known value, unknown (pending), or known absence (none). */
export type IncomeState =
  | { state: "known"; amountUsd: number }
  | { state: "pending" }
  | { state: "none" };

// ---------------------------------------------------------------------------
// Distribution pipeline (withdrawal track — never merged into rental income)
// ---------------------------------------------------------------------------

export interface DistributionSummary {
  /** Withdrawable balance — what the position may request right now. */
  eligible: IncomeState;
  /** Gross amounts of open (requested + approved) withdrawals. */
  requestedUsd: IncomeState;
  openRequestCount: number;
  /** Unpaid installments of live (requested + approved) withdrawals. */
  scheduledUsd: IncomeState;
  scheduledCount: number;
  nextDueUsd: number | null;
  nextDueAt: string | null;
  /** Paid installments — money actually sent, always a definitive sum. */
  paidOutUsd: { state: "known"; amountUsd: number };
  paidCount: number;
}

function isOpenRequest(w: Withdrawal): boolean {
  return w.status === "requested" || w.status === "approved";
}

/**
 * Derive the payout pipeline from the withdrawal ledger. Rejected requests are
 * dead (refunded) and contribute to nothing; paid requests contribute only
 * their paid installments. Empty pipeline → honest `none`, never Pending/$0.
 */
export function summarizeDistribution(
  withdrawals: Withdrawal[],
  withdrawableUsd: number | null,
): DistributionSummary {
  const open = withdrawals.filter(isOpenRequest);
  const requestedUsd = open.reduce((s, w) => s + w.amountUsd, 0);

  const unpaid = open.flatMap((w) =>
    w.installments.filter((i) => i.status !== "paid"),
  );
  const scheduledUsd = unpaid.reduce((s, i) => s + i.amountUsd, 0);
  const nextDue = unpaid.reduce<{ dueAt: string; amountUsd: number } | null>(
    (best, i) => (best == null || i.dueAt < best.dueAt ? { dueAt: i.dueAt, amountUsd: i.amountUsd } : best),
    null,
  );

  const paidInstallments = withdrawals
    .filter((w) => w.status !== "rejected")
    .flatMap((w) => w.installments)
    .filter((i) => i.status === "paid");
  const paidOutUsd = paidInstallments.reduce((s, i) => s + i.amountUsd, 0);

  return {
    eligible: withdrawableUsd == null
      ? { state: "pending" }
      : { state: "known", amountUsd: withdrawableUsd },
    requestedUsd: open.length > 0 ? { state: "known", amountUsd: requestedUsd } : { state: "none" },
    openRequestCount: open.length,
    scheduledUsd: unpaid.length > 0 ? { state: "known", amountUsd: scheduledUsd } : { state: "none" },
    scheduledCount: unpaid.length,
    nextDueUsd: nextDue?.amountUsd ?? null,
    nextDueAt: nextDue?.dueAt ?? null,
    paidOutUsd: { state: "known", amountUsd: paidOutUsd },
    paidCount: paidInstallments.length,
  };
}

// ---------------------------------------------------------------------------
// Per-estate operating income (position truth per estate)
// ---------------------------------------------------------------------------

export interface EstateIncome {
  propertyId: string;
  sharesOwned: number | null;
  shareRatio: number | null;
  /** Pending-ledger sums; none when nothing is pending. */
  projectedUsd: IncomeState;
  /** Active-lock accrual sums; none when the estate has no locks. */
  accruedUsd: IncomeState;
  /** Paid-ledger sums; pending when the estate has no history at all. */
  paidUsd: IncomeState;
}

function activeLocks(locks: ShareLock[], propertyId: string): ShareLock[] {
  return locks.filter((l) => l.propertyId === propertyId && l.status !== "matured");
}

/**
 * One row per estate the user holds or has ledger history for (entries in
 * first-appearance order, then holdings-only estates). Each column keeps its
 * own source: pending ledger, lock accrual, paid ledger.
 */
export function summarizeEstates(input: {
  entries: EarningsEntry[];
  locks: ShareLock[];
  holdings: Holding[];
}): EstateIncome[] {
  const { entries, locks, holdings } = input;
  const order: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    if (!seen.has(e.propertyId)) {
      seen.add(e.propertyId);
      order.push(e.propertyId);
    }
  }
  for (const h of holdings) {
    if (!seen.has(h.propertyId)) {
      seen.add(h.propertyId);
      order.push(h.propertyId);
    }
  }
  const holdingById = new Map(holdings.map((h) => [h.propertyId, h]));
  return order.map((propertyId) => {
    const own = entries.filter((e) => e.propertyId === propertyId);
    const paid = own.filter((e) => e.status === "paid").reduce((s, e) => s + e.amountUsd, 0);
    const pending = own.filter((e) => e.status === "pending").reduce((s, e) => s + e.amountUsd, 0);
    const estateLocks = activeLocks(locks, propertyId);
    const accrued = estateLocks.reduce((s, l) => s + l.accruedUnpaidUsd, 0);
    const holding = holdingById.get(propertyId);
    return {
      propertyId,
      sharesOwned: holding?.sharesOwned ?? null,
      shareRatio: holding?.shareRatio ?? null,
      projectedUsd: pending > 0 ? { state: "known", amountUsd: pending } : { state: "none" },
      accruedUsd: estateLocks.length > 0 ? { state: "known", amountUsd: accrued } : { state: "none" },
      paidUsd: own.length > 0 ? { state: "known", amountUsd: paid } : { state: "pending" },
    };
  });
}

// ---------------------------------------------------------------------------
// Secondary listings (Slice H semantics — proposed gain, never income)
// ---------------------------------------------------------------------------

export interface ListingGain {
  orderId: string;
  propertyId: string;
  title: string;
  quantity: number;
  priceUsd: number;
  status: "open" | "queued";
  acquisitionCostUsd: number | null;
  gainLossUsd: number | null;
  direction: "gain" | "loss" | "breakEven" | "unknown";
  sharesRemaining: number | null;
  remainingRatio: number | null;
}

/**
 * Proposed gain/loss for the user's LIVE sell listings, reusing the Slice H
 * calculation against the real order + position. Unknown basis stays unknown;
 * orders without position/listing data keep nulls rather than guesses. Filled,
 * cancelled and buy orders are out of scope here (not live listings).
 */
export function secondaryGains(input: {
  orders: Order[];
  holdings: Holding[];
  listings: Listing[];
}): ListingGain[] {
  const { orders, holdings, listings } = input;
  const holdingById = new Map(holdings.map((h) => [h.propertyId, h]));
  const listingById = new Map(listings.map((l) => [l.id, l]));
  const out: ListingGain[] = [];
  for (const o of orders) {
    if (o.side !== "sell") continue;
    if (o.status !== "open" && o.status !== "queued") continue;
    const holding = holdingById.get(o.propertyId);
    const listing = listingById.get(o.propertyId);
    let cost: number | null = null;
    let gain: number | null = null;
    let direction: ListingGain["direction"] = "unknown";
    let remaining: number | null = null;
    let ratio: number | null = null;
    if (holding != null && holding.avgCostUsd != null) {
      try {
        const r = gainLossVsAcquisition(o.quantity, o.priceUsd, holding.avgCostUsd);
        cost = r.acquisitionCostUsd;
        gain = r.gainLossUsd;
        direction = r.direction;
      } catch {
        // Invalid inputs (e.g. stale oversell) — stay unknown, never guessed.
      }
      if (o.quantity <= holding.sharesOwned && listing != null && listing.totalShares > 0) {
        remaining = holding.sharesOwned - o.quantity;
        ratio = remaining / listing.totalShares;
      }
    }
    out.push({
      orderId: o.id,
      propertyId: o.propertyId,
      title: listing?.title ?? o.propertyId,
      quantity: o.quantity,
      priceUsd: o.priceUsd,
      status: o.status,
      acquisitionCostUsd: cost,
      gainLossUsd: gain,
      direction,
      sharesRemaining: remaining,
      remainingRatio: ratio,
    });
  }
  return out;
}
