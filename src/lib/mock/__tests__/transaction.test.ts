// File responsibility: assert MockTxRepo.buy() persists holdings + pushes a synthetic-txHash Transaction.
// NOTE: seed.transactions and seed.holdings are mutated in-memory by buy() (intentional for the mock's
// optimistic-update requirement), so these tests assert pre/post counts within a single vitest run rather
// than isolating the array snapshot. Acceptable for an MVP mock.
import { describe, expect, it, beforeEach } from "vitest";
import { MockTxRepo } from "@/lib/mock/transaction";
import { seed } from "@/lib/mock/seed";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { weeklyRent, projectedYield } from "@/lib/format";

describe("MockTxRepo prepareBuy + confirmBuy (mock keeps optimistic settlement)", () => {
  beforeEach(() => {
    // Reset share-based state per-test by importing fresh state is impossible here (the seed is frozen
    // at module-load except for in-memory array mutations on seed.holdings/transactions arrays). We
    // assert pre/post counts instead of exact library state.
  });

  it("prepareBuy returns an intent with destination + a real nanoTON amount", async () => {
    const repo = MockTxRepo();
    const prep = await repo.prepareBuy({
      propertyId: "prop-soho-loft-studio",
      quantity: 5,
      priceUsdPerShare: 15000,
    });
    expect(prep.intentId).toMatch(/^intent-/);
    expect(prep.totalUsd).toBe(75_000);
    expect(prep.currency).toBe("TON");
    expect(prep.message.address.length).toBeGreaterThan(0);
    expect(BigInt(prep.message.amount)).toBeGreaterThan(0n);
    expect(prep.message.payload).toBeNull();
  });

  it("prepareBuy charges the primary-market commission (tier fallback) — buyer pays principal + fee", async () => {
    const repo = MockTxRepo();
    // $750 principal → $500–$2,000 tier (2.5%) → $18.75 commission → $768.75 payable.
    const prep = await repo.prepareBuy({
      propertyId: "prop-soho-loft-studio",
      quantity: 5,
      priceUsdPerShare: 15000,
    });
    expect(prep.feeUsd).toBe(1_875);
    expect(prep.totalPayableUsd).toBe(76_875);
    expect(prep.totalPayableUsd).toBe(prep.totalUsd + (prep.feeUsd ?? 0));

    // The TON message amount is derived from the PAYABLE (principal + fee), not the principal.
    const { estimateNanoTon } = await import("@/lib/format");
    const { TON_PRICE_USD_CENTS } = await import("@/lib/constants");
    expect(prep.message.amount).toBe(
      estimateNanoTon(prep.totalPayableUsd!, TON_PRICE_USD_CENTS).toString(),
    );
  });

  it("confirmBuy records the commission separately as feeUsd on the ledger row", async () => {
    const repo = MockTxRepo();
    const prep = await repo.prepareBuy({
      propertyId: "prop-soho-loft-studio",
      quantity: 5,
      priceUsdPerShare: 15000,
    });
    await repo.confirmBuy({ intentId: prep.intentId });
    const created = seed.transactions[seed.transactions.length - 1]!;
    expect(created.kind).toBe("buy");
    expect(created.amountUsd).toBe(75_000);
    expect(created.feeUsd).toBe(1_875);
  });

  it("prepareBuy supports the USDT rail with a gas-sized message", async () => {
    const repo = MockTxRepo();
    const prep = await repo.prepareBuy({
      propertyId: "prop-soho-loft-studio",
      quantity: 5,
      priceUsdPerShare: 15000,
      currency: "USDT",
    });
    expect(prep.currency).toBe("USDT");
    expect(prep.message.address.length).toBeGreaterThan(0);
    // Mock is off-chain: gas-sized placeholder message, no real jetton body.
    expect(prep.message.amount).toBe("100000000");
    expect(prep.message.payload).toBeNull();
  });

  it("confirmBuy settles in-memory and stamps a synthetic 'simulated:' txHash", async () => {
    const repo = MockTxRepo();
    const before = seed.transactions.length;
    const prep = await repo.prepareBuy({
      propertyId: "prop-soho-loft-studio",
      quantity: 5,
      priceUsdPerShare: 15000,
    });
    const res = await repo.confirmBuy({ intentId: prep.intentId, txHash: "cafebabe" });
    expect(res.status).toBe("confirmed");
    const created = seed.transactions[seed.transactions.length - 1]!;
    expect(created.status).toBe("success");
    expect(created.txHash?.startsWith("simulated:")).toBe(true);
    expect(seed.transactions.length).toBeGreaterThan(before);
  });

  it("verifyAndSettle returns settled for a confirmed intent (mock settles in confirmBuy)", async () => {
    const repo = MockTxRepo();
    const prep = await repo.prepareBuy({
      propertyId: "prop-soho-loft-studio",
      quantity: 3,
      priceUsdPerShare: 15000,
    });
    await repo.confirmBuy({ intentId: prep.intentId, txHash: "cafebabe" });

    const result = await repo.verifyAndSettle(prep.intentId);
    expect(result.intentId).toBe(prep.intentId);
    expect(result.status).toBe("settled");
  });

  it("verifyAndSettle throws for an unknown intent", async () => {
    const repo = MockTxRepo();
    await expect(repo.verifyAndSettle("intent-nope")).rejects.toThrow(/not found/i);
  });

  it("increments the user's sharesOwned for the bought property and recomputes proportional fields", async () => {
    const property = PROPERTIES.find((p) => p.id === "prop-soho-loft-studio")!;
    const beforeHolding = seed.holdings.find((h) => h.propertyId === property.id);
    const beforeShares = beforeHolding?.sharesOwned ?? 0;
    const repo = MockTxRepo();
    const prep = await repo.prepareBuy({
      propertyId: property.id,
      quantity: 7,
      priceUsdPerShare: property.sharePriceUsd,
    });
    await repo.confirmBuy({ intentId: prep.intentId });
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