import { describe, it, expect } from "vitest";
import { MockOrderBookRepo } from "@/lib/mock/orderbook";
import { getCurrentSharePrice } from "@/lib/property-price";
import type { Listing } from "@/types/property";
import { PROPERTIES } from "@/lib/mock/seed/properties";

// Bayside seed ladder mid = lastTradeUsd 25100 → bestAsk = round(25100 × 1.02).
const PID = "prop-bayside-marina-penthouse";
const STANDING_BEST_ASK = Math.round(25_100 * 1.02);

describe("MockOrderBookRepo — user orders must not move the current price", () => {
  it("a limit sell joins the visible asks but never becomes bestAskUsd", async () => {
    const repo = MockOrderBookRepo();
    await repo.placeOrder({ propertyId: PID, side: "sell", priceUsd: 99_900, quantity: 3 });
    const book = await repo.get(PID);

    // Order IS in the book…
    expect(book.asks.some((l) => l.priceUsd === 99_900)).toBe(true);
    // …but the standing market's best ask is untouched.
    expect(book.bestAskUsd).toBe(STANDING_BEST_ASK);
  });

  it("the page-wide current share price ignores the user's resting order", async () => {
    const repo = MockOrderBookRepo();
    await repo.placeOrder({ propertyId: PID, side: "sell", priceUsd: 99_900, quantity: 3 });
    const book = await repo.get(PID);

    const listing = PROPERTIES.find((p) => p.id === PID) as Listing;
    expect(getCurrentSharePrice(listing, { bestAskUsd: book.bestAskUsd })).toBe(
      STANDING_BEST_ASK,
    );
    expect(book.bestAskUsd).not.toBe(99_900);
  });

  it("a funding property with only user orders exposes no best prices (fallback preserved)", async () => {
    const fundingId = PROPERTIES.find((p) => p.status === "funding")!.id;
    const repo = MockOrderBookRepo();
    await repo.placeOrder({
      propertyId: fundingId,
      side: "buy",
      priceUsd: 50_000,
      quantity: 1,
    });
    const book = await repo.get(fundingId);
    expect(book.bids.some((l) => l.priceUsd === 50_000)).toBe(true);
    expect(book.bestBidUsd).toBeUndefined();
    expect(book.bestAskUsd).toBeUndefined();
  });
});
