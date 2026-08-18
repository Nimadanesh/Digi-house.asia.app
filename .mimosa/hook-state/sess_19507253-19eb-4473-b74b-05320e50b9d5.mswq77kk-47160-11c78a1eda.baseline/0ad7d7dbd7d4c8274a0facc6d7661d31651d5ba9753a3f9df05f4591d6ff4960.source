import { describe, expect, it } from "vitest";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryInstantSellStore } from "../sells/instant-sell-store.js";
import { settleInstantSell } from "../sells/settle-instant-sell.js";

const FUNDING = "prop-marina-vista-4b"; // 2500 total, 2300 sold → 200 remaining
const USER = "user-a";

function makeDeps() {
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  const holdings = createMemoryHoldingStore();
  const locks = createMemoryShareLockStore();
  const orders = createMemoryOrderStore();
  const balances = createMemoryBalanceStore();
  const transactions = createMemoryTxStore();
  const instantSells = createMemoryInstantSellStore();
  return {
    properties,
    holdings,
    locks,
    orders,
    balances,
    transactions,
    instantSells,
  };
}

async function queueSellOrder(
  orders: ReturnType<typeof createMemoryOrderStore>,
  propertyId: string,
  qty: number,
  userId = USER,
  id = `ord_${Math.random().toString(36).slice(2, 8)}`,
) {
  return orders.insert({
    id,
    userId,
    propertyId,
    makerAddress: "EQ",
    side: "sell",
    priceUsd: 9_000,
    quantity: qty,
    status: "queued",
  });
}

describe("property-store sellout invariants (PC-04/PC-05)", () => {
  it("markSoldOut flips funding → resale only when supply is zero", async () => {
    const d = makeDeps();
    const partial = await d.properties.markSoldOut(FUNDING); // 200 remaining
    expect(partial?.status).toBe("funding"); // no-op while supply remains

    await d.properties.tryIncrementSharesSold(FUNDING, 200); // sell out
    const soldOut = await d.properties.markSoldOut(FUNDING);
    expect(soldOut?.status).toBe("resale");

    // one-way: never leaves resale
    const again = await d.properties.markSoldOut(FUNDING);
    expect(again?.status).toBe("resale");
  });

  it("tryDecrementSharesSold refuses outside funding (resale never goes back)", async () => {
    const d = makeDeps();
    await d.properties.tryIncrementSharesSold(FUNDING, 200);
    await d.properties.markSoldOut(FUNDING);
    const ok = await d.properties.tryDecrementSharesSold(FUNDING, 5);
    expect(ok).toBe(false);
    expect((await d.properties.getById(FUNDING))?.sharesSold).toBe(2_500);
  });

  it("activateQueuedForProperty flips all queued orders atomically + idempotent", async () => {
    const d = makeDeps();
    await queueSellOrder(d.orders, FUNDING, 10);
    await queueSellOrder(d.orders, FUNDING, 5, "user-b");
    const openOrder = await d.orders.insert({
      id: "ord_open",
      userId: "user-c",
      propertyId: FUNDING,
      makerAddress: "EQ",
      side: "sell",
      priceUsd: 9_500,
      quantity: 3,
      status: "open",
    });
    void openOrder;

    const activated = await d.orders.activateQueuedForProperty(FUNDING);
    expect(activated).toHaveLength(2);
    expect(new Set(activated.map((o) => o.status))).toEqual(new Set(["open"]));
    // second fire: nothing left to activate
    expect(await d.orders.activateQueuedForProperty(FUNDING)).toHaveLength(0);
  });

  it("supply bounce-back (instant sell return) never re-queues activated orders", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: FUNDING,
      sharesOwned: 50,
      avgCostUsd: 8_000,
    });
    await queueSellOrder(d.orders, FUNDING, 10);

    // sell out the primary supply
    await d.properties.tryIncrementSharesSold(FUNDING, 200);
    await d.properties.markSoldOut(FUNDING);
    await d.orders.activateQueuedForProperty(FUNDING);

    // In resale no instant sells exist; simulate a funding-phase bounce instead by
    // resetting to funding (test harness only) and selling back shares:
    d.properties._rows.find((p) => p.id === FUNDING)!.status = "funding";
    const sell = await settleInstantSell(
      {
        properties: d.properties,
        holdings: d.holdings,
        locks: d.locks,
        orders: d.orders,
        balances: d.balances,
        transactions: d.transactions,
        instantSells: d.instantSells,
      },
      { userId: USER, propertyId: FUNDING, shares: 5 },
    );
    expect(sell.ok).toBe(true);

    // The previously activated order is STILL open — never re-queued.
    const order = d.orders._rows.find((o) => o.userId === USER)!;
    expect(order.status).toBe("open");
    // and the book for the property contains it
    const book = await d.orders.listOpenByPropertyId(FUNDING);
    expect(book.map((o) => o.id)).toContain(order.id);
  });
});
