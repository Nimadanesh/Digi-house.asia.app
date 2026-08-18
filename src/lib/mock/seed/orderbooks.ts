// File responsibility: order book states for funded/resale properties + >=1 open order.
import type { Order, OrderBookState, OrderBookLevel } from "@/types/order";
import { PROPERTIES } from "./properties";
import { USER } from "./user";

function ladder(
  mid: number,
  side: "bid" | "ask",
): OrderBookLevel[] {
  const steps =
    side === "bid"
      ? [0.98, 0.96, 0.94, 0.92]
      : [1.02, 1.04, 1.06, 1.08];
  const qtys = [18, 32, 45, 60];
  let cum = 0;
  return steps.map((m, i) => {
    const quantity = qtys[i]!;
    cum += quantity;
    return {
      priceUsd: Math.round(mid * m),
      quantity,
      cumulative: cum,
    };
  });
}

// Order book levels for the 2 funded + 2 resale properties (funding -> empty).
// lastTradeUsd comes from the property's own field (single source of truth, PD-07).
const fundedBooks: Record<string, { bids: OrderBookLevel[]; asks: OrderBookLevel[] }> = {
  "prop-bayside-marina-penthouse": {
    bids: ladder(25100, "bid"),
    asks: ladder(25100, "ask"),
  },
  "prop-alfama-terrace-flat": {
    bids: ladder(10000, "bid"),
    asks: ladder(10000, "ask"),
  },
  "prop-tbilisi-riverhouse-loft": {
    bids: ladder(8000, "bid"),
    asks: ladder(8000, "ask"),
  },
  "prop-canggu-surf-villa": {
    bids: ladder(20000, "bid"),
    asks: ladder(20000, "ask"),
  },
};

export const ORDER_BOOKS: OrderBookState[] = PROPERTIES.map((p) => {
  const book = fundedBooks[p.id];
  if (!book) {
    return {
      propertyId: p.id,
      bids: [],
      asks: [],
    };
  }
  return {
    propertyId: p.id,
    bids: book.bids,
    asks: book.asks,
    bestBidUsd: book.bids[0]?.priceUsd,
    bestAskUsd: book.asks[0]?.priceUsd,
    ...(p.lastTradeUsd ? { lastTradeUsd: p.lastTradeUsd } : {}),
  };
});

// >=1 open order on a held property (demo order book).
export const OPEN_ORDERS: Order[] = [
  {
    id: "ord-aria-alfama-sell-1",
    propertyId: "prop-alfama-terrace-flat",
    makerAddress: USER.walletAddress ?? "",
    side: "sell",
    priceUsd: 10800,
    quantity: 10,
    filledQuantity: 0,
    status: "open",
    createdAt: "2026-07-18T16:30:00Z",
  },
];
