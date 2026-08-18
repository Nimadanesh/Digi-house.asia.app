// File responsibility: PURE matching engine for the secondary market (PD-02).
// No IO — plans fills for one incoming (taker) order against open opposite (maker)
// orders. Price-time priority, partial fills, execution at the MAKER's price,
// self-match prevention (same user, or house-vs-house).
//
// The persistence service (settle-matches.ts) turns these plans into atomic writes;
// keeping the planner pure makes the hard logic exhaustively testable.

import type { OrderSide } from "./map-order.js";

export type EngineOrder = {
  id: string;
  userId: string;
  side: OrderSide;
  priceUsd: number;
  quantity: number;
  filledQuantity: number;
  isHouseAccount: boolean;
  createdAt: Date;
};

export type PlannedFill = {
  /** Maker order that provides liquidity. */
  makerOrderId: string;
  /** Taker order consuming liquidity (the incoming order). */
  takerOrderId: string;
  /** Execution price = the maker's limit price. */
  priceUsd: number;
  quantity: number;
};

/** Remaining unfilled quantity of an order. */
export function remaining(o: EngineOrder): number {
  return Math.max(0, o.quantity - o.filledQuantity);
}

function crosses(taker: EngineOrder, maker: EngineOrder): boolean {
  if (taker.side === maker.side) return false;
  if (taker.side === "buy") {
    // a buy limit crosses asks priced at or below it
    return maker.priceUsd <= taker.priceUsd;
  }
  return maker.priceUsd >= taker.priceUsd;
}

function selfMatch(taker: EngineOrder, maker: EngineOrder): boolean {
  // Never trade with yourself; the house account never trades with itself either.
  return (
    taker.userId === maker.userId ||
    (taker.isHouseAccount && maker.isHouseAccount)
  );
}

/** Best-price-first ordering of makers for a taker: asks ASC for buys, bids DESC for sells. */
export function sortMakersFor(takerSide: OrderSide, makers: EngineOrder[]): EngineOrder[] {
  const sorted = [...makers];
  sorted.sort((a, b) => {
    if (takerSide === "buy") {
      // cheapest ask first; ties → oldest first (price-time)
      return a.priceUsd - b.priceUsd || a.createdAt.getTime() - b.createdAt.getTime();
    }
    return b.priceUsd - a.priceUsd || a.createdAt.getTime() - b.createdAt.getTime();
  });
  return sorted;
}

/**
 * Plan fills for the taker against the maker side. Execution price is always the
 * maker's price (a crossing limit earns price improvement, never pays worse).
 * Returns fills + the taker's unfilled remainder.
 */
export function planFills(
  taker: EngineOrder,
  makers: EngineOrder[],
): { fills: PlannedFill[]; takerRemaining: number } {
  let left = remaining(taker);
  const fills: PlannedFill[] = [];
  if (left <= 0) return { fills, takerRemaining: 0 };

  for (const maker of sortMakersFor(taker.side, makers)) {
    if (left <= 0) break;
    const makerLeft = remaining(maker);
    if (makerLeft <= 0) continue;
    if (selfMatch(taker, maker)) continue;
    if (!crosses(taker, maker)) continue;

    const qty = Math.min(left, makerLeft);
    fills.push({
      makerOrderId: maker.id,
      takerOrderId: taker.id,
      priceUsd: maker.priceUsd,
      quantity: qty,
    });
    left -= qty;
  }
  return { fills, takerRemaining: left };
}
