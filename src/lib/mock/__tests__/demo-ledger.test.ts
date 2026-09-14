// Phase 9 Slice 5 — demo ledger coherence (RED-first).
//
// The demo is explicitly STATEFUL in-session: every action must update every
// related number (orders, holdings, sold/remaining, funding, ledger) or the
// slice has failed. These tests drive the real mock repos (no UI mocks).
import { describe, it, expect } from "vitest";
import { MockOrderBookRepo } from "@/lib/mock/orderbook";
import { MockPortfolioRepo } from "@/lib/mock/portfolio";
import { MockSellsRepo } from "@/lib/mock/sells";
import { MockTxRepo } from "@/lib/mock/transaction";
import { HOLDINGS } from "@/lib/mock/seed/holdings";
import { seed } from "@/lib/mock/seed";
import { demoSoldShares } from "@/lib/mock/canonical-listing";
import { CANONICAL_BASE_PRICE_USD } from "@/lib/economics/canonical-offering";

const orderBook = MockOrderBookRepo();
const portfolio = MockPortfolioRepo();
const sells = MockSellsRepo();
const tx = MockTxRepo();

async function openOrderIds(): Promise<string[]> {
  const summary = await portfolio.summary();
  return summary.openOrders.map((o) => o.id);
}

describe("Slice 5 — placed orders surface in portfolio open orders", () => {
  it("a placed limit-buy appears in the portfolio summary", async () => {
    const placed = await orderBook.placeOrder({
      propertyId: "re-125643",
      side: "buy",
      priceUsd: 8000,
      quantity: 7,
    });
    expect(placed.status).toBe("open");
    expect(await openOrderIds()).toContain(placed.id);
  });

  it("a placed custom sell appears in the portfolio summary", async () => {
    const placed = await orderBook.placeOrder({
      propertyId: "re-108924",
      side: "sell",
      priceUsd: 99_900,
      quantity: 3,
    });
    expect(await openOrderIds()).toContain(placed.id);
  });

  it("a queued sell on a funding property surfaces as queued (never hidden)", async () => {
    const placed = await orderBook.placeOrder({
      propertyId: "re-128862",
      side: "sell",
      priceUsd: 10_000,
      quantity: 1,
    });
    expect(placed.status).toBe("queued");
    const summary = await portfolio.summary();
    expect(summary.openOrders.find((o) => o.id === placed.id)?.status).toBe("queued");
    await orderBook.cancelOrder(placed.id);
  });

  it("cancelling removes the order from the portfolio summary", async () => {
    const placed = await orderBook.placeOrder({
      propertyId: "re-127483",
      side: "buy",
      priceUsd: 11_200,
      quantity: 2,
    });
    expect(await openOrderIds()).toContain(placed.id);
    await orderBook.cancelOrder(placed.id);
    expect(await openOrderIds()).not.toContain(placed.id);
  });
});

describe("Slice 5 — repeated buys accumulate into holdings and the ledger", () => {
  it("two buys add up across holdings, sold shares, and the transaction ledger", async () => {
    const pid = "re-126855";
    const before = demoSoldShares(pid);
    const txBefore = (await tx.listTransactions({ limit: 100 })).transactions.length;

    for (const qty of [2, 3]) {
      const prep = await tx.prepareBuy({
        propertyId: pid,
        quantity: qty,
        priceUsdPerShare: CANONICAL_BASE_PRICE_USD,
        currency: "TON",
      });
      const res = await tx.confirmBuy({ intentId: prep.intentId, txHash: "sim:1" });
      expect(res.status).toBe("confirmed");
      await tx.verifyAndSettle(prep.intentId);
    }

    expect(demoSoldShares(pid)).toBe(before + 5);
    const holding = HOLDINGS.find((h) => h.propertyId === pid)!;
    expect(holding.sharesOwned).toBe(before + 5);
    const txAfter = (await tx.listTransactions({ limit: 100 })).transactions.length;
    expect(txAfter).toBe(txBefore + 2);
  });

  it("re-confirming the same intent never double-mints shares", async () => {
    const pid = "re-130393";
    const before = demoSoldShares(pid);
    const prep = await tx.prepareBuy({
      propertyId: pid,
      quantity: 4,
      priceUsdPerShare: CANONICAL_BASE_PRICE_USD,
      currency: "TON",
    });
    await tx.confirmBuy({ intentId: prep.intentId, txHash: "sim:1" });
    await tx.confirmBuy({ intentId: prep.intentId, txHash: "sim:1" });
    expect(demoSoldShares(pid)).toBe(before + 4);
  });
});

describe("Slice 5 — instant sell settles every related number", () => {
  const pid = "re-128862"; // funding → instant eligible
  const seedTxCount = () => seed.transactions.length;

  it("reduces holdings, records the ledger tx, and reports exact free shares", async () => {
    HOLDINGS.push({
      propertyId: pid,
      sharesOwned: 10,
      avgCostUsd: CANONICAL_BASE_PRICE_USD,
      currentValueUsd: 10 * CANONICAL_BASE_PRICE_USD,
      pendingWeekEarningsUsd: 0,
      shareRatio: 10 / 80_000,
    });
    const txBefore = seedTxCount();
    try {
      const res = await sells.instant({ propertyId: pid, shares: 4 });
      // 4 × $100 − 7% = $372.00 net.
      expect(res.grossUsd).toBe(40_000);
      expect(res.feeUsd).toBe(2_800);
      expect(res.netUsd).toBe(37_200);
      expect(res.status).toBe("settled");
      expect(HOLDINGS.find((h) => h.propertyId === pid)?.sharesOwned).toBe(6);
      // Exact remaining — never double-subtracted.
      expect(res.freeSharesAfter).toBe(6);
      // The ledger shows the sale (buys already record theirs).
      const last = seed.transactions[seed.transactions.length - 1]!;
      expect(last.kind).toBe("instant_sell");
      expect(last.shares).toBe(4);
      expect(last.amountUsd).toBe(37_200);
      expect(seedTxCount()).toBe(txBefore + 1);
      // Ledger-derived sold/remaining follow the mutation.
      expect(demoSoldShares(pid)).toBe(6);
    } finally {
      const i = HOLDINGS.findIndex((h) => h.propertyId === pid);
      if (i >= 0) HOLDINGS.splice(i, 1);
      seed.transactions.splice(txBefore);
    }
  });
});
