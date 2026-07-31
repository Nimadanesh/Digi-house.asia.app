import { describe, expect, it } from "vitest";
import { createMemoryIntentStore, type BuyIntentRecord } from "./intent-store.js";
import { createMemoryTxStore } from "./tx-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { settleVerifiedBuy } from "./settle-verified-buy.js";

const FUNDING = "prop-marina-vista-4b"; // sharesSold 920, total 1000

function confirmedIntent(over: Partial<BuyIntentRecord> = {}): BuyIntentRecord {
  return {
    id: "intent-1",
    userId: "user-a",
    propertyId: FUNDING,
    quantity: 5,
    priceUsdPerShare: 12_500,
    totalUsd: 62_500,
    status: "confirmed",
    boc: null,
    destinationAddress: "EQD-admin",
    paidByWallet: null,
    currency: "TON",
    expectedNanoTon: "312500000000",
    expectedJettonAmount: null,
    txHash: "realhash".repeat(8),
    expiresAt: new Date(Date.now() + 3_600_000),
    confirmedAt: new Date(),
    settledAt: null,
    createdAt: new Date(),
    ...over,
  };
}

function makeDeps() {
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore();
  const transactions = createMemoryTxStore();
  const intents = createMemoryIntentStore();
  return { properties, holdings, transactions, intents };
}

describe("settleVerifiedBuy", () => {
  it("settles: bumps shares_sold, creates holding, inserts success tx with real txHash", async () => {
    const deps = makeDeps();
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 12_500, totalUsd: 62_500,
      destinationAddress: "EQD-admin", expectedNanoTon: "312500000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await deps.intents.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "realhash".repeat(8) });

    const r = await settleVerifiedBuy(deps, { intent: (await deps.intents.getById("intent-1"))!, actualAmountNano: "312500000001" });
    expect(r.ok).toBe(true);

    const listing = await deps.properties.getById(FUNDING);
    expect(listing!.sharesSold).toBe(925);

    const holding = await deps.holdings.get("user-a", FUNDING);
    expect(holding?.sharesOwned).toBe(5);
    expect(holding?.avgCostUsd).toBe(12_500);

    const txs = await deps.transactions.listByUserId("user-a");
    expect(txs).toHaveLength(1);
    expect(txs[0]!.kind).toBe("buy");
    expect(txs[0]!.status).toBe("success");
    expect(txs[0]!.txHash).toBe("realhash".repeat(8));
    expect(txs[0]!.buyIntentId).toBe("intent-1");
    expect(txs[0]!.tonAmount).toBe(312_500_000_001);
    expect(txs[0]!.amountUsd).toBe(62_500);

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
      quantity: 5, priceUsdPerShare: 12_500, totalUsd: 62_500,
      destinationAddress: "EQD-admin", expectedNanoTon: "312500000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await deps.intents.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "h".repeat(64) });

    await settleVerifiedBuy(deps, { intent: (await deps.intents.getById("intent-1"))! });

    const holding = await deps.holdings.get("user-a", FUNDING);
    expect(holding?.sharesOwned).toBe(15);
    // (10000*10 + 12500*5) / 15 = 10833.33 → 10833
    expect(holding?.avgCostUsd).toBe(10_833);
  });

  it("already settled intent → ok with alreadySettled, no double increment", async () => {
    const deps = makeDeps();
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 12_500, totalUsd: 62_500,
      destinationAddress: "EQD-admin", expectedNanoTon: "312500000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await deps.intents.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "h".repeat(64) });
    const intent = (await deps.intents.getById("intent-1"))!;

    const first = await settleVerifiedBuy(deps, { intent });
    expect(first.ok).toBe(true);
    const second = await settleVerifiedBuy(deps, { intent: (await deps.intents.getById("intent-1"))! });
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.alreadySettled).toBe(true);

    expect((await deps.properties.getById(FUNDING))!.sharesSold).toBe(925);
    expect(await deps.transactions.listByUserId("user-a")).toHaveLength(1);
  });

  it("not confirmed intent → ok:false, no writes", async () => {
    const deps = makeDeps();
    await deps.intents.create({
      id: "intent-1", userId: "user-a", propertyId: FUNDING,
      quantity: 5, priceUsdPerShare: 12_500, totalUsd: 62_500,
      destinationAddress: "EQD-admin", expectedNanoTon: "312500000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    const intent = (await deps.intents.getById("intent-1"))!; // status pending

    const r = await settleVerifiedBuy(deps, { intent });
    expect(r).toEqual({ ok: false, reason: "not_confirmed" });
    expect((await deps.properties.getById(FUNDING))!.sharesSold).toBe(920);
    expect(await deps.transactions.listByUserId("user-a")).toHaveLength(0);
  });
});
