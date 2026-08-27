import { describe, expect, it } from "vitest";
import { createMemoryIntentStore, type BuyIntentRecord } from "./intent-store.js";

function seedIntent(over: Partial<BuyIntentRecord> = {}): BuyIntentRecord {
  return {
    id: "intent-1",
    userId: "user-a",
    propertyId: "prop-1",
    quantity: 5,
    priceUsdPerShare: 12_500,
    totalUsd: 62_500,
    feeUsd: null,
    status: "pending",
    boc: null,
    destinationAddress: "EQD-admin",
    paidByWallet: null,
    currency: "TON",
    expectedNanoTon: "312500000000",
    expectedJettonAmount: null,
    txHash: null,
    expiresAt: new Date(Date.now() + 3_600_000),
    confirmedAt: null,
    settledAt: null,
    createdAt: new Date(),
    ...over,
  };
}

describe("createMemoryIntentStore", () => {
  it("persists destination + expected nanoTON at create", async () => {
    const store = createMemoryIntentStore();
    const intent = await store.create({
      id: "intent-2",
      userId: "user-a",
      propertyId: "prop-1",
      quantity: 3,
      priceUsdPerShare: 12_500,
      totalUsd: 37_500,
      destinationAddress: "EQD-admin",
      expectedNanoTon: "187500000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    expect(intent.destinationAddress).toBe("EQD-admin");
    expect(intent.expectedNanoTon).toBe("187500000000");
    expect(intent.txHash).toBeNull();
    expect(intent.status).toBe("pending");
  });

  it("markConfirmedIfPending records the txHash", async () => {
    const store = createMemoryIntentStore([seedIntent()]);
    const r = await store.markConfirmedIfPending("intent-1", "user-a", new Date(), {
      boc: "boc:x",
      txHash: "deadbeef",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.intent.status).toBe("confirmed");
    expect(r.intent.txHash).toBe("deadbeef");
    expect(r.intent.boc).toBe("boc:x");
  });

  it("markSettled claims confirmed → settled once, then rejects as already_settled", async () => {
    const store = createMemoryIntentStore([
      seedIntent({ status: "confirmed", txHash: "deadbeef", confirmedAt: new Date() }),
    ]);
    const first = await store.markSettled("intent-1", "user-a", new Date());
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.intent.status).toBe("settled");
      expect(first.intent.settledAt).not.toBeNull();
    }
    const second = await store.markSettled("intent-1", "user-a", new Date());
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("already_settled");
  });

  it("markSettled rejects a pending (not yet confirmed) intent", async () => {
    const store = createMemoryIntentStore([seedIntent()]);
    const r = await store.markSettled("intent-1", "user-a", new Date());
    expect(r).toEqual({ ok: false, reason: "not_confirmed" });
  });

  it("markSettled rejects another user's intent", async () => {
    const store = createMemoryIntentStore([
      seedIntent({ status: "confirmed", txHash: "x", confirmedAt: new Date() }),
    ]);
    const r = await store.markSettled("intent-1", "user-b", new Date());
    expect(r).toEqual({ ok: false, reason: "not_owned" });
  });

  it("confirm then settle flows through both claims atomically", async () => {
    const store = createMemoryIntentStore([seedIntent()]);
    await store.markConfirmedIfPending("intent-1", "user-a", new Date(), { txHash: "abc123" });
    const settled = await store.markSettled("intent-1", "user-a", new Date());
    expect(settled.ok).toBe(true);
    const row = await store.getById("intent-1");
    expect(row?.status).toBe("settled");
    expect(row?.txHash).toBe("abc123");
  });

  it("findByTxHash returns the intent that consumed a hash, null when unused", async () => {
    const store = createMemoryIntentStore([
      seedIntent({ status: "confirmed", txHash: "used-hash", confirmedAt: new Date() }),
      seedIntent({ id: "intent-2", status: "pending" }),
    ]);
    expect((await store.findByTxHash("used-hash"))?.id).toBe("intent-1");
    expect(await store.findByTxHash("never-used")).toBeNull();
  });

  it("create records the paidByWallet for the payer check", async () => {
    const store = createMemoryIntentStore();
    const intent = await store.create({
      id: "intent-3",
      userId: "user-a",
      propertyId: "prop-1",
      quantity: 1,
      priceUsdPerShare: 12_500,
      totalUsd: 12_500,
      destinationAddress: "EQD-admin",
      paidByWallet: "EQD-payer",
      expectedNanoTon: "62500000000",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    expect(intent.paidByWallet).toBe("EQD-payer");
  });
});
