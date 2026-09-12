// File responsibility: tests for the Slice I income view-model — explicit economic
// state separation over the existing repo contracts. Every state derives from a
// distinct source; missing data yields pending/none, never a fabricated zero.
import { describe, expect, it } from "vitest";
import {
  summarizeDistribution,
  summarizeEstates,
  secondaryGains,
} from "@/lib/income-view-model";
import type { EarningsEntry } from "@/types/earnings";
import type { ShareLock } from "@/types/lock";
import type { Withdrawal } from "@/types/withdrawal";
import type { Holding } from "@/types/position";
import type { Listing } from "@/types/property";
import type { Order } from "@/types/order";

function entry(overrides: Partial<EarningsEntry>): EarningsEntry {
  return {
    id: "e",
    userId: "u",
    propertyId: "test-a",
    weekOf: "2026-07-13T00:00:00Z",
    amountUsd: 1_000,
    tonAmount: 5_000_000_000,
    shareRatio: 0.1,
    status: "paid",
    ...overrides,
  };
}

function lock(overrides: Partial<ShareLock>): ShareLock {
  return {
    id: "lock-1",
    propertyId: "test-a",
    shares: 100,
    principalUsd: 1_000_000,
    payoutPeriod: "monthly",
    monthlyRate: 6,
    status: "locked",
    lockedAt: "2026-07-01T00:00:00Z",
    unlockRequestedAt: null,
    maturedAt: null,
    nextPayoutAt: "2026-08-01T00:00:00Z",
    maturesAt: null,
    accruedUnpaidUsd: 4_200,
    installmentUsd: 5_000,
    projectedMonthlyUsd: 5_000,
    projectedWeeklyUsd: 1_200,
    ...overrides,
  };
}

function withdrawal(overrides: Partial<Withdrawal>): Withdrawal {
  return {
    id: "wd-1",
    amountUsd: 10_000,
    feeUsd: 100,
    netUsd: 9_900,
    address: "EQtest",
    status: "requested",
    txHash: null,
    installments: [
      { seq: 1, amountUsd: 2_475, status: "paid", dueAt: "2026-07-08T00:00:00Z", paidAt: "2026-07-08T00:00:00Z", txHash: "sim:1" },
      { seq: 2, amountUsd: 2_475, status: "pending", dueAt: "2026-07-15T00:00:00Z", paidAt: null, txHash: null },
      { seq: 3, amountUsd: 2_475, status: "pending", dueAt: "2026-07-22T00:00:00Z", paidAt: null, txHash: null },
      { seq: 4, amountUsd: 2_475, status: "pending", dueAt: "2026-07-29T00:00:00Z", paidAt: null, txHash: null },
    ],
    createdAt: "2026-07-01T00:00:00Z",
    updatedAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Distribution: requested ≠ scheduled ≠ paid; rejected excluded everywhere
// ---------------------------------------------------------------------------

describe("summarizeDistribution — state separation", () => {
  it("requested counts the open pipeline (requested + approved), never paid out", () => {
    const d = summarizeDistribution(
      [
        withdrawal({ id: "a", status: "requested", amountUsd: 10_000 }),
        withdrawal({ id: "b", status: "approved", amountUsd: 5_000 }),
        withdrawal({ id: "c", status: "paid", amountUsd: 7_000 }),
        withdrawal({ id: "d", status: "rejected", amountUsd: 9_000 }),
      ],
      3_000,
    );
    expect(d.requestedUsd).toEqual({ state: "known", amountUsd: 15_000 });
    expect(d.openRequestCount).toBe(2);
    // Paid and rejected requests are not requested money.
    expect(d.paidOutUsd.amountUsd).toBeLessThan(15_000 + 7_000 + 9_000);
  });

  it("scheduled counts only unpaid installments of live requests", () => {
    const d = summarizeDistribution([withdrawal({})], 3_000);
    // 1 paid + 3 pending installments on a requested withdrawal.
    expect(d.scheduledUsd).toEqual({ state: "known", amountUsd: 7_425 });
    expect(d.scheduledCount).toBe(3);
    expect(d.nextDueUsd).toBe(2_475);
    expect(d.nextDueAt).toBe("2026-07-15T00:00:00Z");
  });

  it("paidOut sums only paid installments (withdrawal track, not rental income)", () => {
    const d = summarizeDistribution([withdrawal({})], 3_000);
    expect(d.paidOutUsd).toEqual({ state: "known", amountUsd: 2_475 });
    expect(d.paidCount).toBe(1);
  });

  it("rejected requests contribute to nothing", () => {
    const d = summarizeDistribution(
      [withdrawal({ id: "r", status: "rejected" })],
      3_000,
    );
    expect(d.requestedUsd).toEqual({ state: "none" });
    expect(d.scheduledUsd).toEqual({ state: "none" });
    expect(d.paidOutUsd).toEqual({ state: "known", amountUsd: 0 });
    expect(d.nextDueAt).toBeNull();
  });

  it("empty pipeline is honest none (not Pending, not $0-requested)", () => {
    const d = summarizeDistribution([], 3_000);
    expect(d.requestedUsd).toEqual({ state: "none" });
    expect(d.scheduledUsd).toEqual({ state: "none" });
    expect(d.openRequestCount).toBe(0);
    expect(d.eligible).toEqual({ state: "known", amountUsd: 3_000 });
  });

  it("unknown withdrawable balance stays pending (never a fake $0)", () => {
    const d = summarizeDistribution([], null);
    expect(d.eligible).toEqual({ state: "pending" });
  });
});

// ---------------------------------------------------------------------------
// Estates: projected / accrued / paid per position from distinct sources
// ---------------------------------------------------------------------------

describe("summarizeEstates — per-position states", () => {
  const holdings: Holding[] = [
    { propertyId: "test-a", sharesOwned: 160, avgCostUsd: 12_000, currentValueUsd: 1_920_000, pendingWeekEarningsUsd: 2_000, shareRatio: 0.064 },
    { propertyId: "test-b", sharesOwned: 50, avgCostUsd: 10_000, currentValueUsd: 500_000, pendingWeekEarningsUsd: 0, shareRatio: 0.05 },
  ];

  it("derives each state from its own source", () => {
    const rows = summarizeEstates({
      entries: [
        entry({ propertyId: "test-a", status: "paid", amountUsd: 1_500 }),
        entry({ propertyId: "test-a", status: "pending", amountUsd: 500 }),
      ],
      locks: [lock({ propertyId: "test-a", accruedUnpaidUsd: 4_200 })],
      holdings,
    });
    const a = rows.find((r) => r.propertyId === "test-a")!;
    expect(a.paidUsd).toEqual({ state: "known", amountUsd: 1_500 });
    expect(a.projectedUsd).toEqual({ state: "known", amountUsd: 500 });
    expect(a.accruedUsd).toEqual({ state: "known", amountUsd: 4_200 });
    expect(a.sharesOwned).toBe(160);
    expect(a.shareRatio ?? NaN).toBeCloseTo(0.064, 12);
  });

  it("pending sums never leak into paid", () => {
    const rows = summarizeEstates({
      entries: [entry({ propertyId: "test-a", status: "pending", amountUsd: 500 })],
      locks: [],
      holdings,
    });
    const a = rows.find((r) => r.propertyId === "test-a")!;
    expect(a.paidUsd).toEqual({ state: "known", amountUsd: 0 });
    expect(a.projectedUsd).toEqual({ state: "known", amountUsd: 500 });
  });

  it("estates without locks show no accrued line (none, not Pending, not $0)", () => {
    const rows = summarizeEstates({
      entries: [entry({ propertyId: "test-a", status: "paid", amountUsd: 1_500 })],
      locks: [],
      holdings,
    });
    const a = rows.find((r) => r.propertyId === "test-a")!;
    expect(a.accruedUsd).toEqual({ state: "none" });
  });

  it("holdings without any entries still appear (position truth)", () => {
    const rows = summarizeEstates({ entries: [], locks: [], holdings });
    const b = rows.find((r) => r.propertyId === "test-b")!;
    expect(b.sharesOwned).toBe(50);
    expect(b.paidUsd).toEqual({ state: "pending" });
    expect(b.projectedUsd).toEqual({ state: "none" });
  });

  it("matured locks do not accrue", () => {
    const rows = summarizeEstates({
      entries: [],
      locks: [lock({ propertyId: "test-a", status: "matured", accruedUnpaidUsd: 9_999 })],
      holdings,
    });
    const a = rows.find((r) => r.propertyId === "test-a")!;
    expect(a.accruedUsd).toEqual({ state: "none" });
  });
});

// ---------------------------------------------------------------------------
// Secondary listings: proposed gain/loss via Slice H, never income
// ---------------------------------------------------------------------------

describe("secondaryGains — listed positions, not income", () => {
  const listings = [
    { id: "test-a", title: "Villa A", totalShares: 1_000 },
    { id: "test-b", title: "Villa B", totalShares: 2_000 },
  ] as Listing[];
  const holdings: Holding[] = [
    { propertyId: "test-a", sharesOwned: 160, avgCostUsd: 12_000, currentValueUsd: 1_920_000, pendingWeekEarningsUsd: 0, shareRatio: 0.16 },
  ];
  const order = (overrides: Partial<Order>): Order => ({
    id: "ord-1",
    propertyId: "test-a",
    makerAddress: "EQx",
    side: "sell",
    priceUsd: 12_500,
    quantity: 10,
    filledQuantity: 0,
    status: "open",
    createdAt: "2026-07-01T00:00:00Z",
    ...overrides,
  });

  it("computes the proposed gain from the real order + position", () => {
    const [g] = secondaryGains({ orders: [order({})], holdings, listings });
    expect(g.title).toBe("Villa A");
    expect(g.acquisitionCostUsd).toBe(120_000);
    expect(g.gainLossUsd).toBe(5_000);
    expect(g.direction).toBe("gain");
    expect(g.sharesRemaining).toBe(150);
    expect(g.status).toBe("open");
  });

  it("loss and break-even pass through honestly", () => {
    const [loss] = secondaryGains({
      orders: [order({ id: "l", priceUsd: 10_000 })],
      holdings,
      listings,
    });
    expect(loss.direction).toBe("loss");
    expect(loss.gainLossUsd).toBe(-20_000);
    const [flat] = secondaryGains({
      orders: [order({ id: "f", priceUsd: 12_000 })],
      holdings,
      listings,
    });
    expect(flat.direction).toBe("breakEven");
    expect(flat.gainLossUsd).toBe(0);
  });

  it("ignores buy orders and dead listings", () => {
    const rows = secondaryGains({
      orders: [
        order({ id: "buy", side: "buy" }),
        order({ id: "filled", status: "filled" }),
        order({ id: "cancelled", status: "cancelled" }),
      ],
      holdings,
      listings,
    });
    expect(rows).toEqual([]);
  });

  it("unknown basis stays unknown (never guessed)", () => {
    const [g] = secondaryGains({
      orders: [order({ propertyId: "test-b" })],
      holdings: [],
      listings,
    });
    expect(g.acquisitionCostUsd).toBeNull();
    expect(g.gainLossUsd).toBeNull();
    expect(g.direction).toBe("unknown");
  });
});
