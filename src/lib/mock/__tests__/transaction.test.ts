// File responsibility: assert MockTxRepo.buy() persists holdings + pushes a synthetic-txHash Transaction.
// NOTE: seed.transactions and seed.holdings are mutated in-memory by buy() (intentional for the mock's
// optimistic-update requirement), so these tests assert pre/post counts within a single vitest run rather
// than isolating the array snapshot. Acceptable for an MVP mock.
import { describe, expect, it, beforeEach } from "vitest";
import { MockTxRepo } from "@/lib/mock/transaction";
import { seed } from "@/lib/mock/seed";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { weeklyRent, projectedYield } from "@/lib/format";

describe("MockTxRepo.buy() persists holdings + pushes a synthetic-txHash Transaction", () => {
  beforeEach(() => {
    // Reset share-based state per-test by importing fresh state is impossible here (the seed is frozen
    // at module-load except for in-memory array mutations on seed.holdings/transactions arrays). We
    // assert pre/post counts instead of exact library state.
  });

  it("stamps a synthetic txHash beginning with 'simulated:'", async () => {
    const repo = MockTxRepo();
    const before = seed.transactions.length;
    const tx = await repo.buy({ propertyId: "prop-soho-loft-studio", quantity: 5, priceUsdPerShare: 15000 });
    expect(tx.status).toBe("success");
    expect(tx.txHash?.startsWith("simulated:")).toBe(true);
    expect(seed.transactions.length).toBeGreaterThan(before);
  });

  it("increments the user's sharesOwned for the bought property and recomputes proportional fields", async () => {
    const property = PROPERTIES.find((p) => p.id === "prop-soho-loft-studio")!;
    const beforeHolding = seed.holdings.find((h) => h.propertyId === property.id);
    const beforeShares = beforeHolding?.sharesOwned ?? 0;
    const repo = MockTxRepo();
    await repo.buy({ propertyId: property.id, quantity: 7, priceUsdPerShare: property.sharePriceUsd });
    const afterHolding = seed.holdings.find((h) => h.propertyId === property.id);
    expect(afterHolding).toBeDefined();
    expect(afterHolding!.sharesOwned).toBe(beforeShares + 7);
    // shareRatio recomputed against totalShares
    expect(afterHolding!.shareRatio).toBeCloseTo(afterHolding!.sharesOwned / property.totalShares, 6);
    // pendingWeekEarningsUsd = weeklyRent(annualRentUsd) × shareRatio (integer floor per DATA_MODELS)
    const expectedPending = projectedYield(weeklyRent(property.annualRentUsd), afterHolding!.sharesOwned, property.totalShares);
    expect(afterHolding!.pendingWeekEarningsUsd).toBe(expectedPending);
  });
});