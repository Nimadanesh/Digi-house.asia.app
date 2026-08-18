import { describe, expect, it } from "vitest";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryTradeStore } from "../orders/trade-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import {
  createMemoryFeeTierStore,
  DEFAULT_FEE_TIERS,
} from "../fees/fee-tier-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { placeHouseOrder, type AdminRouteDeps } from "./admin.js";

// Funded (legacy sold-out) property → secondary book, open to house orders.
const PROP = "prop-alfama-terrace-flat";

function makeDeps(
  over: { feeTiers?: AdminRouteDeps["feeTiers"] } = {},
): AdminRouteDeps & {
  orders: ReturnType<typeof createMemoryOrderStore>;
  trades: ReturnType<typeof createMemoryTradeStore>;
  balances: ReturnType<typeof createMemoryBalanceStore>;
} {
  const orders = createMemoryOrderStore();
  const trades = createMemoryTradeStore();
  const balances = createMemoryBalanceStore();
  return {
    adminSecret: "x",
    properties: createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert)),
    orders,
    trades,
    holdings: createMemoryHoldingStore(),
    balances,
    feeTiers: createMemoryFeeTierStore(),
    transactions: createMemoryTxStore(),
    houseAccountUserId: "house-account",
    ...over,
  };
}

describe("placeHouseOrder (PD-03/PE-06)", () => {
  it("buy with no covering fee tier → { error: \"no_fee_tier\" }, no order, no balance row", async () => {
    // Empty tier list → resolveFee finds no tier for any buy notional.
    const deps = makeDeps({ feeTiers: createMemoryFeeTierStore([]) });
    const result = await placeHouseOrder(deps, PROP, "buy", 10_000, 5);
    expect(result).toEqual({ error: "no_fee_tier" });
    expect(deps.orders._rows).toHaveLength(0);
    expect(await deps.balances.get("house-account")).toBeNull();
    expect(deps.trades._rows).toHaveLength(0);
  });

  it("buy below the $80 floor (no tier covers) → no_fee_tier, nothing written", async () => {
    // Default tiers: tier 1 starts at 8_000 cents; a $1 notional matches nothing.
    const deps = makeDeps();
    const result = await placeHouseOrder(deps, PROP, "buy", 100, 1);
    expect(result).toEqual({ error: "no_fee_tier" });
    expect(deps.orders._rows).toHaveLength(0);
    expect(await deps.balances.get("house-account")).toBeNull();
  });

  it("sell never hits the fee-tier path (no escrow) and places a flagged open order", async () => {
    const deps = makeDeps();
    const result = await placeHouseOrder(deps, PROP, "sell", 12_000, 5);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.order.side).toBe("sell");
    expect(result.order.isHouseAccount).toBe(true);
    expect(result.order.status).toBe("open");
    expect(result.order.escrowedUsd).toBe(0);
    expect(result.order.userId).toBe("house-account");
    expect(deps.orders._rows).toHaveLength(1);
  });

  it("buy happy path: escrow provisioned on demand (net zero balance) + flagged open order", async () => {
    const deps = makeDeps();
    const result = await placeHouseOrder(deps, PROP, "buy", 12_000, 5);
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.order.side).toBe("buy");
    expect(result.order.isHouseAccount).toBe(true);
    expect(result.order.status).toBe("open");
    // Notional 60_000 + tier-2 buy fee (80 bps = 480) → escrow held on the order.
    expect(result.order.escrowedUsd).toBe(60_480);
    // Provisioned then debited back → the balance row nets to zero.
    const balance = await deps.balances.get("house-account");
    expect(balance?.investingUsd ?? 0).toBe(0);
    // Empty book → nothing executed.
    expect(result.executedQuantity).toBe(0);
    expect(deps.trades._rows).toHaveLength(0);
    expect(DEFAULT_FEE_TIERS.length).toBeGreaterThan(0);
  });
});
