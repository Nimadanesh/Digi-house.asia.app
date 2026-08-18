import { describe, expect, it } from "vitest";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryTradeStore } from "../orders/trade-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryFeeTierStore } from "../fees/fee-tier-store.js";
import { createOrderRoutes, type OrderRouteDeps } from "./orders.js";

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };
const RESALE = "prop-tbilisi-riverhouse-loft";
const SELLER = "user-seller";
const BUYER = "user-buyer";

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeDeps() {
  const users = createMemoryUserStore([
    { id: SELLER, displayName: "S" },
    { id: BUYER, displayName: "B" },
  ]);
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore();
  const locks = createMemoryShareLockStore();
  const orders = createMemoryOrderStore();
  const trades = createMemoryTradeStore();
  const balances = createMemoryBalanceStore();
  const transactions = createMemoryTxStore();
  const feeTiers = createMemoryFeeTierStore();

  const deps: OrderRouteDeps = {
    session: SESSION,
    users,
    properties,
    orders,
    holdings,
    locks,
    balances,
    feeTiers,
    trades,
    transactions,
    allowlist: new Set(),
    launchMode: "open",
    rateLimiter: async (_c, next) => next(),
  };
  return { deps, users, properties, holdings, locks, orders, trades, balances, transactions };
}

async function placeOrder(
  app: ReturnType<typeof createOrderRoutes>,
  userId: string,
  body: Record<string, unknown>,
) {
  return app.request("/v1/orders", {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: await bearerFor(userId) },
    body: JSON.stringify(body),
  });
}

describe("POST /v1/orders — escrow + matching (PD-01/PD-02)", () => {
  it("buy without funds → 409 insufficient_funds, no order created", async () => {
    const d = makeDeps();
    const app = createOrderRoutes(d.deps);
    const res = await placeOrder(app, BUYER, {
      propertyId: RESALE, side: "buy", priceUsd: 10_000, quantity: 5,
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "insufficient_funds" });
    expect(d.orders._rows).toHaveLength(0);
  });

  it("crossing buy executes against the resting ask; escrow + fills settle", async () => {
    const d = makeDeps();
    // resting ask: seller has shares
    await d.holdings.upsert({
      userId: SELLER, propertyId: RESALE, sharesOwned: 10, avgCostUsd: 12_000,
    });
    const app = createOrderRoutes(d.deps);
    const ask = await placeOrder(app, SELLER, {
      propertyId: RESALE, side: "sell", priceUsd: 12_000, quantity: 4,
    });
    expect(ask.status).toBe(201);

    // buyer funded: $500 (50_000) covers 4 × $120 + fee
    await d.balances.adjust(BUYER, { investingDelta: 60_000 });
    const bid = await placeOrder(app, BUYER, {
      propertyId: RESALE, side: "buy", priceUsd: 12_500, quantity: 4,
    });
    expect(bid.status).toBe(201);
    const bidBody = (await bid.json()) as {
      status: string; executedQuantity: number; escrowedUsd: number;
    };
    expect(bidBody.status).toBe("filled");
    expect(bidBody.executedQuantity).toBe(4);

    // holdings moved
    expect((await d.holdings.get(BUYER, RESALE))?.sharesOwned).toBe(4);
    expect((await d.holdings.get(SELLER, RESALE))?.sharesOwned).toBe(6);
    // seller credited net of the sell fee
    const s = await d.balances.get(SELLER);
    expect(s!.investingUsd).toBe(48_000 - 432); // 0.9% tier 1
    // trades recorded + book last price
    expect(d.trades._rows).toHaveLength(1);
    const book = (await (
      await app.request(`/v1/properties/${RESALE}/order-book`)
    ).json()) as { lastTradeUsd?: number };
    expect(book.lastTradeUsd).toBe(12_000);
  });

  it("GET /v1/properties/:id/trades lists fills", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: SELLER, propertyId: RESALE, sharesOwned: 10, avgCostUsd: 12_000,
    });
    const app = createOrderRoutes(d.deps);
    await placeOrder(app, SELLER, { propertyId: RESALE, side: "sell", priceUsd: 12_000, quantity: 2 });
    await d.balances.adjust(BUYER, { investingDelta: 60_000 });
    await placeOrder(app, BUYER, { propertyId: RESALE, side: "buy", priceUsd: 12_000, quantity: 2 });

    const res = await app.request(`/v1/properties/${RESALE}/trades`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { trades: Array<{ priceUsd: number; quantity: number }> };
    expect(body.trades).toHaveLength(1);
    expect(body.trades[0]).toMatchObject({ priceUsd: 12_000, quantity: 2 });
  });

  it("cancel of an unfilled buy refunds the escrow (PD-08)", async () => {
    const d = makeDeps();
    const app = createOrderRoutes(d.deps);
    await d.balances.adjust(BUYER, { investingDelta: 60_000 });
    const placed = await placeOrder(app, BUYER, {
      propertyId: RESALE, side: "buy", priceUsd: 10_000, quantity: 3,
    });
    const order = (await placed.json()) as { id: string };
    // escrow held
    expect((await d.balances.get(BUYER))?.investingUsd).toBeLessThan(60_000);

    const cancel = await app.request(`/v1/orders/${order.id}`, {
      method: "DELETE",
      headers: { Authorization: await bearerFor(BUYER) },
    });
    expect(cancel.status).toBe(204);
    const after = await d.balances.get(BUYER);
    expect(after?.investingUsd).toBe(60_000); // full refund
  });

  it("queued sell on funding property never matches (escrow only)", async () => {
    const d = makeDeps();
    const FUNDING = "prop-marina-vista-4b";
    await d.holdings.upsert({
      userId: SELLER, propertyId: FUNDING, sharesOwned: 10, avgCostUsd: 8_000,
    });
    const app = createOrderRoutes(d.deps);
    const res = await placeOrder(app, SELLER, {
      propertyId: FUNDING, side: "sell", priceUsd: 9_000, quantity: 5,
    });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ status: "queued" });
    expect(d.trades._rows).toHaveLength(0);
  });
});
