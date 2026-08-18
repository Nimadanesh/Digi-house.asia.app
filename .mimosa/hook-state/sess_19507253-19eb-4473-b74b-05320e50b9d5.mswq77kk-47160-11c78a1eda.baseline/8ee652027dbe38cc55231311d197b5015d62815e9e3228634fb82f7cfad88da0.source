import { describe, expect, it } from "vitest";
import { buildOrderBookState } from "./build-order-book.js";

describe("buildOrderBookState", () => {
  it("returns empty arrays with no best* when no orders", () => {
    const book = buildOrderBookState("prop-a", []);
    expect(book).toEqual({
      propertyId: "prop-a",
      bids: [],
      asks: [],
    });
    expect(book.bestBidUsd).toBeUndefined();
    expect(book.bestAskUsd).toBeUndefined();
  });

  it("aggregates two buys at same price", () => {
    const book = buildOrderBookState("prop-a", [
      { side: "buy", priceUsd: 10_000, quantity: 5, filledQuantity: 0 },
      { side: "buy", priceUsd: 10_000, quantity: 3, filledQuantity: 0 },
    ]);
    expect(book.bids).toEqual([
      { priceUsd: 10_000, quantity: 8, cumulative: 8 },
    ]);
    expect(book.bestBidUsd).toBe(10_000);
  });

  it("sorts bids DESC and asks ASC with cumulative", () => {
    const book = buildOrderBookState("prop-a", [
      { side: "buy", priceUsd: 9_000, quantity: 2, filledQuantity: 0 },
      { side: "buy", priceUsd: 11_000, quantity: 4, filledQuantity: 0 },
      { side: "sell", priceUsd: 110, quantity: 3, filledQuantity: 0 },
      { side: "sell", priceUsd: 100, quantity: 5, filledQuantity: 0 },
    ]);
    expect(book.bids.map((l) => l.priceUsd)).toEqual([11_000, 9_000]);
    expect(book.asks).toEqual([
      { priceUsd: 100, quantity: 5, cumulative: 5 },
      { priceUsd: 110, quantity: 3, cumulative: 8 },
    ]);
    expect(book.bestBidUsd).toBe(11_000);
    expect(book.bestAskUsd).toBe(100);
  });

  it("uses remaining = quantity - filledQuantity", () => {
    const book = buildOrderBookState("prop-a", [
      { side: "buy", priceUsd: 100, quantity: 10, filledQuantity: 4 },
      { side: "sell", priceUsd: 200, quantity: 5, filledQuantity: 5 },
    ]);
    expect(book.bids).toEqual([
      { priceUsd: 100, quantity: 6, cumulative: 6 },
    ]);
    expect(book.asks).toEqual([]);
  });

  it("ignores remaining <= 0", () => {
    const book = buildOrderBookState("prop-a", [
      { side: "buy", priceUsd: 50, quantity: 3, filledQuantity: 3 },
      { side: "buy", priceUsd: 50, quantity: 2, filledQuantity: 5 },
    ]);
    expect(book.bids).toEqual([]);
  });
});
