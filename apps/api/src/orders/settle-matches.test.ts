import { describe, expect, it } from "vitest";
import { createMemoryOrderStore } from "./order-store.js";
import { createMemoryTradeStore } from "./trade-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore, type TxStore } from "../buys/tx-store.js";
import type { TransactionRecord } from "../buys/tx-store.js";
import { DEFAULT_FEE_TIERS } from "../fees/fee-tier-store.js";
import { buyEscrowUsd, settleMatchesForTaker, type SettleMatchesDeps } from "./settle-matches.js";

const PROP = "prop-tbilisi-riverhouse-loft";
const SELLER = "user-seller";
const BUYER = "user-buyer";

function makeDeps() {
  const orders = createMemoryOrderStore();
  const trades = createMemoryTradeStore();
  const holdings = createMemoryHoldingStore();
  const balances = createMemoryBalanceStore();
  const transactions: TxStore & { _rows: TransactionRecord[] } = createMemoryTxStore();
  const deps: SettleMatchesDeps = {
    orders,
    trades,
    holdings,
    balances,
    transactions,
    feeTiers: DEFAULT_FEE_TIERS,
  };
  return { deps, orders, trades, holdings, balances, transactions };
}

async function seedSell(deps: SettleMatchesDeps, price: number, qty: number, userId = SELLER, owned = 100) {
  await deps.holdings.upsert({
    userId,
    propertyId: PROP,
    sharesOwned: owned,
    avgCostUsd: 12_000,
  });
  return deps.orders.insert({
    id: `sell-${price}-${qty}`,
    userId,
    propertyId: PROP,
    makerAddress: "EQ",
    side: "sell",
    priceUsd: price,
    quantity: qty,
    status: "open",
  });
}

describe("buyEscrowUsd", () => {
  it("escrows notional + tier fee", () => {
    // $500 buy (50_000 cents) → tier 1 buy_secondary 0.9% = 450 → escrow 50_450
    const e = buyEscrowUsd(DEFAULT_FEE_TIERS, 50_000, 1)!;
    expect(e.notional).toBe(50_000);
    expect(e.fee).toBe(450);
    expect(e.total).toBe(50_450);
  });
  it("null below the tier floor", () => {
    expect(buyEscrowUsd(DEFAULT_FEE_TIERS, 1_000, 1)).toBeNull();
  });
});

describe("settleMatchesForTaker", () => {
  it("full flow: taker buy sweeps two asks; money + shares conserve", async () => {
    const d = makeDeps();
    await seedSell(d.deps, 12_000, 4, SELLER, 10);   // $120 × 4
    await seedSell(d.deps, 12_500, 6, "user-seller2", 10);
    // buyer: $1,200 budget → escrow at limit 12_500 × 8 + tier fee
    const escrow = buyEscrowUsd(DEFAULT_FEE_TIERS, 12_500, 8)!;
    await d.balances.adjust(BUYER, { investingDelta: escrow.total + 100_000 });

    const taker = await d.orders.insert({
      id: "taker",
      userId: BUYER,
      propertyId: PROP,
      makerAddress: "EQ",
      side: "buy",
      priceUsd: 12_500,
      quantity: 8,
      status: "open",
      escrowedUsd: escrow.total,
    });
    await d.balances.adjust(BUYER, { investingDelta: -escrow.total });

    const { fills, taker: after } = await settleMatchesForTaker(d.deps, taker);

    // fills: cheapest ask first (12_000 × 4) then 12_500 × 4 — executed at MAKER price
    expect(fills.map((f) => [f.priceUsd, f.quantity])).toEqual([
      [12_000, 4],
      [12_500, 4],
    ]);
    expect(after.status).toBe("filled");
    expect(after.escrowedUsd).toBe(0); // leftover refunded

    // shares: buyer 8, sellers each −sold qty
    expect((await d.holdings.get(BUYER, PROP))?.sharesOwned).toBe(8);
    expect((await d.holdings.get(SELLER, PROP))?.sharesOwned).toBe(6);
    expect((await d.holdings.get("user-seller2", PROP))?.sharesOwned).toBe(6); // 10 − 4 sold

    // seller 1: 4 × $120 = $480 notional, fee tier1 0.9% = 432 → net 47_568
    const s1 = await d.balances.get(SELLER);
    expect(s1?.investingUsd).toBe(48_000 - 432);

    // money conservation: buyer keeps 100_000 minus exactly what fills consumed
    // (fills cost notional + per-fill tier fees; escrow leftover refunded).
    const buyer = await d.balances.get(BUYER);
    const spentNotional = 4 * 12_000 + 4 * 12_500; // 98_000
    const buyFees = fills.reduce((s, f) => s + f.buyFeeUsd, 0);
    expect(buyer?.investingUsd).toBe(
      100_000 + (escrow.total - spentNotional - buyFees),
    );
    expect(escrow.total - spentNotional - buyFees).toBeGreaterThan(0); // price improvement refunded

    // trade rows + ledger rows
    expect(d.trades._rows).toHaveLength(2);
    expect(d.transactions._rows.filter((t) => t.kind === "trade_buy")).toHaveLength(2);
    expect(d.transactions._rows.filter((t) => t.kind === "trade_sell")).toHaveLength(2);
  });

  it("sell taker crosses bids; buyer escrow released, seller credited", async () => {
    const d = makeDeps();
    // maker BUY: $100 × 5 = 50_000 notional, escrow incl fee
    const escrow = buyEscrowUsd(DEFAULT_FEE_TIERS, 10_000, 5)!;
    await d.balances.adjust(BUYER, { investingDelta: escrow.total });
    await d.orders.insert({
      id: "bid",
      userId: BUYER,
      propertyId: PROP,
      makerAddress: "EQ",
      side: "buy",
      priceUsd: 10_000,
      quantity: 5,
      status: "open",
      escrowedUsd: escrow.total,
    });
    await d.balances.adjust(BUYER, { investingDelta: -escrow.total });

    await d.holdings.upsert({
      userId: SELLER, propertyId: PROP, sharesOwned: 5, avgCostUsd: 9_000,
    });
    const taker = await d.orders.insert({
      id: "ask",
      userId: SELLER,
      propertyId: PROP,
      makerAddress: "EQ",
      side: "sell",
      priceUsd: 9_900, // crosses the 10_000 bid → executes at 10_000
      quantity: 5,
      status: "open",
    });

    const { fills } = await settleMatchesForTaker(d.deps, taker);
    expect(fills[0]!.priceUsd).toBe(10_000); // maker price, not 9_900
    expect(fills[0]!.quantity).toBe(5);

    const buyer = await d.balances.get(BUYER);
    expect(buyer?.investingUsd).toBe(0); // fully consumed (notional + fee escrowed & released)
    const seller = await d.balances.get(SELLER);
    expect(seller?.investingUsd).toBe(50_000 - fills[0]!.sellFeeUsd);
    expect(await d.holdings.get(SELLER, PROP)).toBeNull(); // G11: zero holding deleted
    expect((await d.holdings.get(BUYER, PROP))?.sharesOwned).toBe(5);
  });

  it("no cross → order stays open with escrow intact; cancel path refunds", async () => {
    const d = makeDeps();
    const escrow = buyEscrowUsd(DEFAULT_FEE_TIERS, 10_000, 2)!;
    await d.balances.adjust(BUYER, { investingDelta: escrow.total });
    const taker = await d.orders.insert({
      id: "no-cross",
      userId: BUYER,
      propertyId: PROP,
      makerAddress: "EQ",
      side: "buy",
      priceUsd: 10_000,
      quantity: 2,
      status: "open",
      escrowedUsd: escrow.total,
    });
    await d.balances.adjust(BUYER, { investingDelta: -escrow.total });

    const { fills } = await settleMatchesForTaker(d.deps, taker);
    expect(fills).toEqual([]);
    const open = (await d.orders.getById(taker.id))!;
    expect(open.status).toBe("open");
    expect(open.escrowedUsd).toBe(escrow.total); // still held while live

    // cancel: releaseEscrow refunds
    await d.orders.cancelIfOpen(taker.id, BUYER);
    const released = await d.orders.releaseEscrow(taker.id);
    expect(released).toBe(escrow.total);
    await d.balances.adjust(BUYER, { investingDelta: released });
    expect((await d.balances.get(BUYER))?.investingUsd).toBe(escrow.total);
  });

  it("self-match prevention end-to-end (same user never trades with self)", async () => {
    const d = makeDeps();
    await seedSell(d.deps, 10_000, 5, SELLER, 10);
    const taker = await d.orders.insert({
      id: "self-buy",
      userId: SELLER, // same user as the ask
      propertyId: PROP,
      makerAddress: "EQ",
      side: "buy",
      priceUsd: 11_000,
      quantity: 5,
      status: "open",
      escrowedUsd: 0,
    });
    const { fills } = await settleMatchesForTaker(d.deps, taker);
    expect(fills).toEqual([]);
    expect(d.trades._rows).toHaveLength(0);
  });

  it("replay-proof: duplicate (taker, maker, seq) trade keys are rejected", async () => {
    const d = makeDeps();
    await expect(
      d.trades.insert({
        id: "a", propertyId: PROP, priceUsd: 1, quantity: 1,
        buyerUserId: "b", sellerUserId: "s",
        buyFeeUsd: 0, sellFeeUsd: 0,
        makerOrderId: "m", takerOrderId: "t", fillSeq: 0,
      }),
    ).resolves.toBeTruthy();
    await expect(
      d.trades.insert({
        id: "b", propertyId: PROP, priceUsd: 1, quantity: 1,
        buyerUserId: "b", sellerUserId: "s",
        buyFeeUsd: 0, sellFeeUsd: 0,
        makerOrderId: "m", takerOrderId: "t", fillSeq: 0,
      }),
    ).rejects.toThrow(/duplicate/);
  });
});
