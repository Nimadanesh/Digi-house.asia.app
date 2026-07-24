// File responsibility: order book states for funded/resale properties + >=1 open order.
import type { Order, OrderBookState, OrderBookLevel } from "@/types/order";
import { PROPERTIES } from "./properties";
import { USER } from "./user";

// Order book levels for the 2 funded + 2 resale properties (funding -> empty).
const fundedBooks: Record<string, { bids: OrderBookLevel[]; asks: OrderBookLevel[]; lastTradeUsd: number }> = {
  "prop-bayside-marina-penthouse": {
    bids: [{ priceUsd: 24500, quantity: 12, cumulative: 12 }],
    asks: [{ priceUsd: 25800, quantity: 8, cumulative: 8 }],
    lastTradeUsd: 25100,
  },
  "prop-alfama-terrace-flat": {
    bids: [{ priceUsd: 9800, quantity: 25, cumulative: 25 }],
    asks: [{ priceUsd: 10300, quantity: 15, cumulative: 15 }],
    lastTradeUsd: 10000,
  },
  "prop-tbilisi-riverhouse-loft": {
    bids: [{ priceUsd: 7600, quantity: 40, cumulative: 40 }],
    asks: [{ priceUsd: 8400, quantity: 20, cumulative: 20 }],
    lastTradeUsd: 8000,
  },
  "prop-canggu-surf-villa": {
    bids: [{ priceUsd: 19200, quantity: 30, cumulative: 30 }],
    asks: [{ priceUsd: 20800, quantity: 18, cumulative: 18 }],
    lastTradeUsd: 20000,
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
    bestBidUsd: book.bids[0].priceUsd,
    bestAskUsd: book.asks[0].priceUsd,
    lastTradeUsd: book.lastTradeUsd,
  };
});

// >=1 open order on a resale property.
export const OPEN_ORDERS: Order[] = [
  {
    id: "ord-aria-canggu-sell-1",
    propertyId: "prop-canggu-surf-villa",
    makerAddress: USER.walletAddress ?? "",
    side: "sell",
    priceUsd: 20500,
    quantity: 5,
    filledQuantity: 0,
    status: "open",
    createdAt: "2026-07-18T16:30:00Z",
  },
];