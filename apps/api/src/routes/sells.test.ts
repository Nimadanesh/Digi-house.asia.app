import { describe, expect, it } from "vitest";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryInstantSellStore } from "../sells/instant-sell-store.js";
import { createSellRoutes, type SellRouteDeps } from "./sells.js";
import { createOrderRoutes, type OrderRouteDeps } from "./orders.js";

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };
const USER = "user-a";
const FUNDING = "prop-marina-vista-4b";
const RESALE = "prop-tbilisi-riverhouse-loft";

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeDeps() {
  const users = createMemoryUserStore([{ id: USER, displayName: "A" }]);
  const properties = createMemoryPropertyStore(
    SEED_PROPERTIES.map(toPropertyInsert),
  );
  const holdings = createMemoryHoldingStore();
  const locks = createMemoryShareLockStore();
  const orders = createMemoryOrderStore();
  const balances = createMemoryBalanceStore();
  const transactions = createMemoryTxStore();
  const instantSells = createMemoryInstantSellStore();

  const deps: SellRouteDeps = {
    session: SESSION,
    users,
    properties,
    holdings,
    locks,
    orders,
    balances,
    transactions,
    instantSells,
    // bypass the module-level shared rate limiter across tests
    rateLimiter: async (_c, next) => next(),
  };
  const orderDeps: OrderRouteDeps = {
    session: SESSION,
    users,
    properties,
    orders,
    holdings,
    locks,
    allowlist: new Set(),
    launchMode: "open",
  };
  return { deps, orderDeps, users, properties, holdings, locks, orders, balances, transactions, instantSells };
}

describe("POST /v1/sells/instant", () => {
  it("201 — settles, credits investing, returns shares to supply", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: FUNDING,
      sharesOwned: 10,
      avgCostUsd: 8_000,
    });
    const app = createSellRoutes(d.deps);
    const res = await app.request("/v1/sells/instant", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: await bearerFor(USER) },
      body: JSON.stringify({ propertyId: FUNDING, shares: 4 }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, number>;
    expect(body.grossUsd).toBe(32_000);
    expect(body.feeUsd).toBe(2_240);
    expect(body.netUsd).toBe(29_760);
    expect(body.sharesRemaining).toBe(204);
    expect(body.freeSharesAfter).toBe(6);
    expect((await d.balances.get(USER))?.investingUsd).toBe(29_760);
  });

  it("409 invalid_phase on resale — points to market orders", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: RESALE,
      sharesOwned: 5,
      avgCostUsd: 12_000,
    });
    const app = createSellRoutes(d.deps);
    const res = await app.request("/v1/sells/instant", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: await bearerFor(USER) },
      body: JSON.stringify({ propertyId: RESALE, shares: 1 }),
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_phase" });
  });

  it("409 insufficient_free_shares / 404 no property / 401 no auth", async () => {
    const d = makeDeps();
    const app = createSellRoutes(d.deps);
    const headers = {
      "content-type": "application/json",
      Authorization: await bearerFor(USER),
    };
    await d.holdings.upsert({
      userId: USER,
      propertyId: FUNDING,
      sharesOwned: 3,
      avgCostUsd: 8_000,
    });
    const tooMany = await app.request("/v1/sells/instant", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId: FUNDING, shares: 5 }),
    });
    expect(tooMany.status).toBe(409);

    const missing = await app.request("/v1/sells/instant", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId: "prop-none", shares: 1 }),
    });
    expect(missing.status).toBe(404);

    const noAuth = await app.request("/v1/sells/instant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId: FUNDING, shares: 1 }),
    });
    expect(noAuth.status).toBe(401);
  });
});

describe("POST /v1/orders — Phase C rules", () => {
  it("custom sell on funding property is created as 'queued'", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: FUNDING,
      sharesOwned: 10,
      avgCostUsd: 8_000,
    });
    const app = createOrderRoutes(d.orderDeps);
    const res = await app.request("/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: await bearerFor(USER) },
      body: JSON.stringify({
        propertyId: FUNDING,
        side: "sell",
        priceUsd: 9_000,
        quantity: 4,
      }),
    });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ status: "queued" });
    // queued orders are NOT in the tradable book
    expect(await d.orders.listOpenByPropertyId(FUNDING)).toHaveLength(0);
    // but they escrow the shares
    expect(await d.orders.sumActiveSellShares(USER, FUNDING)).toBe(4);
  });

  it("custom sell on resale property is 'open' immediately", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: RESALE,
      sharesOwned: 5,
      avgCostUsd: 12_000,
    });
    const app = createOrderRoutes(d.orderDeps);
    const res = await app.request("/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: await bearerFor(USER) },
      body: JSON.stringify({
        propertyId: RESALE,
        side: "sell",
        priceUsd: 13_000,
        quantity: 2,
      }),
    });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({ status: "open" });
  });

  it("buy orders rejected while the primary offering is open", async () => {
    const d = makeDeps();
    const app = createOrderRoutes(d.orderDeps);
    const res = await app.request("/v1/orders", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: await bearerFor(USER) },
      body: JSON.stringify({
        propertyId: FUNDING,
        side: "buy",
        priceUsd: 8_000,
        quantity: 1,
      }),
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ code: "invalid_phase" });
  });

  it("sell escrow validation: locked + escrowed shares are not sellable twice", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: FUNDING,
      sharesOwned: 10,
      avgCostUsd: 8_000,
    });
    await d.locks.create({
      id: "lock-1",
      userId: USER,
      propertyId: FUNDING,
      shares: 4,
      principalUsd: 32_000,
      payoutPeriod: "monthly",
      monthlyRate: 7.19,
      nextPayoutAt: new Date(Date.now() + 30 * 86_400_000),
    });
    const app = createOrderRoutes(d.orderDeps);
    const headers = { "content-type": "application/json", Authorization: await bearerFor(USER) };
    // first: escrow 4 of the 6 free
    const first = await app.request("/v1/orders", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId: FUNDING, side: "sell", priceUsd: 9_000, quantity: 4 }),
    });
    expect(first.status).toBe(201);
    // second order needs more than the 2 remaining free → 409
    const second = await app.request("/v1/orders", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId: FUNDING, side: "sell", priceUsd: 9_500, quantity: 3 }),
    });
    expect(second.status).toBe(409);
    await expect(second.json()).resolves.toMatchObject({
      code: "insufficient_free_shares",
    });
  });

  it("queued orders can be cancelled (escrow released)", async () => {
    const d = makeDeps();
    await d.holdings.upsert({
      userId: USER,
      propertyId: FUNDING,
      sharesOwned: 10,
      avgCostUsd: 8_000,
    });
    const app = createOrderRoutes(d.orderDeps);
    const headers = { "content-type": "application/json", Authorization: await bearerFor(USER) };
    const created = (await (
      await app.request("/v1/orders", {
        method: "POST",
        headers,
        body: JSON.stringify({ propertyId: FUNDING, side: "sell", priceUsd: 9_000, quantity: 10 }),
      })
    ).json()) as { id: string };

    expect(await d.orders.sumActiveSellShares(USER, FUNDING)).toBe(10);
    const cancel = await app.request(`/v1/orders/${created.id}`, {
      method: "DELETE",
      headers: { Authorization: headers.Authorization },
    });
    expect(cancel.status).toBe(204);
    expect(await d.orders.sumActiveSellShares(USER, FUNDING)).toBe(0);
  });
});
