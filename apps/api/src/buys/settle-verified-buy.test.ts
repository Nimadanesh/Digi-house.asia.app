import { describe, expect, it } from "vitest";
import { createMemoryAuditStore } from "../audit/audit-store.js";
import { createMemoryIntentStore } from "./intent-store.js";
import { createMemoryTxStore } from "./tx-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryOrderStore } from "../orders/order-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { settleVerifiedBuy } from "./settle-verified-buy.js";

const FUNDING = "prop-marina-vista-4b"; // sharesSold 2300, total 1000

function makeDeps() {
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore();
  const transactions = createMemoryTxStore();
  const intents = createMemoryIntentStore();
  const audit = createMemoryAuditStore();
  const orders = createMemoryOrderStore();
  return { properties, holdings, transactions, intents, audit, orders };
}

describe("settleVerifiedBuy", () => {
  it("settles: bumps shares_sold, creates holding, inserts success tx with real txHash", async () => {
    const deps = makeDeps();
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 8_000, totalUsd: 40_000,
      destinationAddress: "EQD-admin", expectedNanoTon: "200000000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await deps.intents.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "realhash".repeat(8) });

    const r = await settleVerifiedBuy(deps, { intent: (await deps.intents.getById("intent-1"))!, actualAmountNano: "200000000001" });
    expect(r.ok).toBe(true);

    const listing = await deps.properties.getById(FUNDING);
    expect(listing!.sharesSold).toBe(2305);

    const holding = await deps.holdings.get("user-a", FUNDING);
    expect(holding?.sharesOwned).toBe(5);
    expect(holding?.avgCostUsd).toBe(8_000);

    const txs = await deps.transactions.listByUserId("user-a");
    expect(txs).toHaveLength(1);
    expect(txs[0]!.kind).toBe("buy");
    expect(txs[0]!.status).toBe("success");
    expect(txs[0]!.txHash).toBe("realhash".repeat(8));
    expect(txs[0]!.buyIntentId).toBe("intent-1");
    expect(txs[0]!.tonAmount).toBe(200_000_000_001);
    expect(txs[0]!.amountUsd).toBe(40_000);

    const intent = await deps.intents.getById("intent-1");
    expect(intent?.status).toBe("settled");
  });

  it("upserts an existing holding with weighted average cost", async () => {
    const deps = makeDeps();
    deps.holdings._rows.push({
      userId: "user-a", propertyId: FUNDING, sharesOwned: 10, avgCostUsd: 10_000, updatedAt: new Date(),
    });
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 8_000, totalUsd: 40_000,
      destinationAddress: "EQD-admin", expectedNanoTon: "200000000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await deps.intents.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "h".repeat(64) });

    await settleVerifiedBuy(deps, { intent: (await deps.intents.getById("intent-1"))! });

    const holding = await deps.holdings.get("user-a", FUNDING);
    expect(holding?.sharesOwned).toBe(15);
    // (10000*10 + 8000*5) / 15 = 9333.33 → 9333
    expect(holding?.avgCostUsd).toBe(9_333);
  });

  it("already settled intent → ok with alreadySettled, no double increment", async () => {
    const deps = makeDeps();
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 8_000, totalUsd: 40_000,
      destinationAddress: "EQD-admin", expectedNanoTon: "200000000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await deps.intents.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "h".repeat(64) });
    const intent = (await deps.intents.getById("intent-1"))!;

    const first = await settleVerifiedBuy(deps, { intent });
    expect(first.ok).toBe(true);
    const second = await settleVerifiedBuy(deps, { intent: (await deps.intents.getById("intent-1"))! });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.alreadySettled).toBe(true);

    expect((await deps.properties.getById(FUNDING))!.sharesSold).toBe(2305);
    expect(await deps.transactions.listByUserId("user-a")).toHaveLength(1);
  });

  it("not confirmed intent → ok:false, no writes", async () => {
    const deps = makeDeps();
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 8_000, totalUsd: 40_000,
      destinationAddress: "EQD-admin", expectedNanoTon: "200000000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    const intent = (await deps.intents.getById("intent-1"))!; // status pending

    const r = await settleVerifiedBuy(deps, { intent });
    expect(r).toEqual({ ok: false, reason: "not_confirmed" });
    expect((await deps.properties.getById(FUNDING))!.sharesSold).toBe(2300);
    expect(await deps.transactions.listByUserId("user-a")).toHaveLength(0);
  });

  it("sellout emits property.sellout + order.activate audit events (PF-03)", async () => {
    const deps = makeDeps();
    const intent = await createSettledIntent(deps, "user-a", 200); // remaining = 80? no: 2500-2300 = 200
    // Seed a queued sell order that must activate on sellout.
    await deps.orders.insert({
      id: "ord-queued-1",
      userId: "user-b",
      propertyId: FUNDING,
      makerAddress: "EQ",
      side: "sell",
      priceUsd: 9_000,
      quantity: 2,
      status: "queued",
    });

    const r = await settleVerifiedBuy(
      { ...deps, audit: deps.audit, orders: deps.orders },
      { intent },
    );
    expect(r).toMatchObject({ ok: true, soldOut: true });

    // One-way transition happened.
    expect((await deps.properties.getById(FUNDING))!.status).toBe("resale");
    // The queued sell activated.
    expect((await deps.orders.getById("ord-queued-1"))?.status).toBe("open");

    const actions = deps.audit._rows.map((a) => a.action);
    expect(actions).toContain("property.sellout");
    expect(actions).toContain("order.activate");
    const selloutAudit = deps.audit._rows.find((a) => a.action === "property.sellout")!;
    expect(selloutAudit.actorType).toBe("system");
    expect(selloutAudit.resourceId).toBe(FUNDING);
    const activateAudit = deps.audit._rows.find((a) => a.action === "order.activate")!;
    expect(activateAudit.resourceId).toBe("ord-queued-1");
  });

  it("no sellout → no property.sellout / order.activate audit", async () => {
    const deps = makeDeps();
    const intent = await createSettledIntent(deps, "user-a", 5);
    const r = await settleVerifiedBuy(
      { ...deps, audit: deps.audit, orders: deps.orders },
      { intent },
    );
    expect(r).toMatchObject({ ok: true });
    const actions = deps.audit._rows.map((a) => a.action);
    expect(actions).not.toContain("property.sellout");
    expect(actions).not.toContain("order.activate");
  });
});

describe("concurrency — oversell primary (PF-04)", () => {
  it("two concurrent settles within supply both land; sharesSold = sum, no loss", async () => {
    const deps = makeDeps();
    // remaining supply = 2500 − 2300 = 200; 60 + 60 = 120 ≤ 200.
    const a = await createSettledIntent(deps, "user-a", 60);
    const b = await createSettledIntent(deps, "user-b", 60);

    const results = await Promise.allSettled([
      settleVerifiedBuy({ ...deps, audit: deps.audit, orders: deps.orders }, { intent: a }),
      settleVerifiedBuy({ ...deps, audit: deps.audit, orders: deps.orders }, { intent: b }),
    ]);

    expect(results.every((r) => r.status === "fulfilled" && r.value.ok)).toBe(true);
    expect((await deps.properties.getById(FUNDING))!.sharesSold).toBe(2300 + 120);
    expect((await deps.holdings.get("user-a", FUNDING))?.sharesOwned).toBe(60);
    expect((await deps.holdings.get("user-b", FUNDING))?.sharesOwned).toBe(60);
  });

  it("two concurrent settles exceeding supply: exactly one wins, no oversell", async () => {
    const deps = makeDeps();
    // remaining = 200; 150 + 150 > 200 → the guarded tryIncrement must refuse one.
    const a = await createSettledIntent(deps, "user-a", 150);
    const b = await createSettledIntent(deps, "user-b", 150);

    const results = await Promise.allSettled([
      settleVerifiedBuy({ ...deps, audit: deps.audit, orders: deps.orders }, { intent: a }),
      settleVerifiedBuy({ ...deps, audit: deps.audit, orders: deps.orders }, { intent: b }),
    ]);

    // One settle lands; the loser fails loudly (never a partial/oversold settle).
    const ok = results.filter((r) => r.status === "fulfilled" && r.value.ok);
    const failed = results.filter((r) => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);

    const listing = await deps.properties.getById(FUNDING);
    expect(listing!.sharesSold).toBeLessThanOrEqual(listing!.totalShares);
    expect(listing!.sharesSold).toBe(2300 + 150);

    // Only the winning user holds shares; the loser holds nothing.
    const holdings = [
      (await deps.holdings.get("user-a", FUNDING))?.sharesOwned ?? 0,
      (await deps.holdings.get("user-b", FUNDING))?.sharesOwned ?? 0,
    ];
    expect(Math.max(...holdings)).toBe(150);
    expect(Math.min(...holdings)).toBe(0);
  });
});

/** Create + confirm an intent, return the record ready to settle. */
async function createSettledIntent(
  deps: ReturnType<typeof makeDeps>,
  userId: string,
  quantity: number,
) {
  await deps.intents.create({
    id: `intent-${userId}-${quantity}`,
    userId,
    propertyId: FUNDING,
    quantity,
    priceUsdPerShare: 8_000,
    totalUsd: quantity * 8_000,
    destinationAddress: "EQD-admin",
    expectedNanoTon: "200000000000",
    expiresAt: new Date(Date.now() + 3_600_000),
  });
  await deps.intents.markConfirmedIfPending(
    `intent-${userId}-${quantity}`,
    userId,
    new Date(),
    { txHash: `h${quantity}`.repeat(8) },
  );
  return (await deps.intents.getById(`intent-${userId}-${quantity}`))!;
}
