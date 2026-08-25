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

// Order book levels for funded/resale properties (funding -> empty).
// The ladder mid derives from the property's OWN current price — last trade for
// secondary listings, else list price (lib/property-price hierarchy) — so the book
// can never drift away from the price shown in Hero/Metrics/Calculator.
const fundedBooks = new Map(
  PROPERTIES.filter((p) => p.status !== "funding").map((p) => [
    p.id,
    { mid: p.lastTradeUsd ?? p.sharePriceUsd },
  ]),
);

export const ORDER_BOOKS: OrderBookState[] = PROPERTIES.map((p) => {
  const book = fundedBooks.get(p.id);
  if (!book) {
    return {
      propertyId: p.id,
      bids: [],
      asks: [],
    };
  }
  const bids = ladder(book.mid, "bid");
  const asks = ladder(book.mid, "ask");
  return {
    propertyId: p.id,
    bids,
    asks,
    bestBidUsd: bids[0]?.priceUsd,
    bestAskUsd: asks[0]?.priceUsd,
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
