import { describe, expect, it } from "vitest";
import type { TonTxClient, OnChainTx } from "./tx-client.js";
import { verifyBuyPayment } from "./verify-buy-payment.js";

const ADMIN_RAW = "0:1111111111111111111111111111111111111111111111111111111111111111";
const HASH = "a".repeat(64);
const EXPECTED = 312_500_000_000n; // 312.5 TON

/** Build a valid friendly TON address from a raw workchain:hash (bounceable, url-safe). */
function friendly(raw: string): string {
  const [, wc, hash] = /^(-?\d+):([0-9a-f]{64})$/.exec(raw)!;
  const body = Buffer.alloc(34);
  body[0] = 0x11;
  body[1] = Number(wc ?? 0) & 0xff;
  body.set(Buffer.from(hash ?? "", "hex"), 2);
  let crc = 0xffff;
  for (const byte of body) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return Buffer.concat([body, Buffer.from([crc >> 8, crc & 0xff])]).toString("base64url");
}

const ADMIN_FRIENDLY = friendly(ADMIN_RAW);

function clientOf(tx: OnChainTx): TonTxClient {
  return {
    async getTransactionByMessageHash() {
      return { kind: "found" as const, tx };
    },
    async getJettonTransfer() {
      return { kind: "not_found" as const };
    },
    async getJettonWalletAddress() {
      return { kind: "error" as const };
    },
  };
}

function tx(over: Partial<{ success: boolean; utime: number; outMessages: Array<{ destinationAddress?: string; valueNano?: string }> }> = {}) {
  return {
    hash: HASH,
    success: true,
    utime: Math.floor(Date.now() / 1000),
    outMessages: [{ destinationAddress: ADMIN_RAW, valueNano: EXPECTED.toString() }],
    ...over,
  };
}

describe("verifyBuyPayment", () => {
  const input = {
    txHash: HASH,
    expectedDestinationAddress: ADMIN_RAW,
    expectedAmountNano: EXPECTED,
    referenceTimeMs: Date.now(),
    maxAgeMs: 30 * 60 * 1000,
  };

  it("returns valid with the actual amount for a matching payment", async () => {
    const client = clientOf(tx());
    const r = await verifyBuyPayment(client, input);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.actualAmountNano).toBe(EXPECTED.toString());
  });

  it("accepts an overpayment (amount >= expected)", async () => {
    const client = clientOf(tx({ outMessages: [{ destinationAddress: ADMIN_RAW, valueNano: (EXPECTED + 1n).toString() }] }));
    const r = await verifyBuyPayment(client, input);
    expect(r.valid).toBe(true);
  });

  it("tx_not_found when the chain has no such message yet", async () => {
    const client: TonTxClient = {
      async getTransactionByMessageHash() { return { kind: "not_found" }; },
      async getJettonTransfer() { return { kind: "not_found" as const }; },
      async getJettonWalletAddress() { return { kind: "error" as const }; },
    };
    const r = await verifyBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "tx_not_found" });
  });

  it("api_unavailable on lookup error (retryable)", async () => {
    const client: TonTxClient = {
      async getTransactionByMessageHash() { return { kind: "error" }; },
      async getJettonTransfer() { return { kind: "not_found" as const }; },
      async getJettonWalletAddress() { return { kind: "error" as const }; },
    };
    const r = await verifyBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "api_unavailable" });
  });

  it("tx_failed when the on-chain transaction did not succeed", async () => {
    const client = clientOf(tx({ success: false }));
    const r = await verifyBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "tx_failed" });
  });

  it("destination_mismatch when no out message targets the expected address", async () => {
    const client = clientOf(tx({ outMessages: [{ destinationAddress: "0:2222222222222222222222222222222222222222222222222222222222222222", valueNano: EXPECTED.toString() }] }));
    const r = await verifyBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "destination_mismatch", actualAmountNano: EXPECTED.toString() });
  });

  it("amount_insufficient when the transferred amount is below expected", async () => {
    const client = clientOf(tx({ outMessages: [{ destinationAddress: ADMIN_RAW, valueNano: (EXPECTED - 1n).toString() }] }));
    const r = await verifyBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "amount_insufficient", actualAmountNano: (EXPECTED - 1n).toString() });
  });

  it("tx_too_old when the transaction predates the recency window", async () => {
    const client = clientOf(tx({ utime: Math.floor((Date.now() - 31 * 60 * 1000) / 1000) }));
    const r = await verifyBuyPayment(client, input);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe("tx_too_old");
  });

  it("matches the admin destination across friendly/raw forms", async () => {
    const client = clientOf(tx({ outMessages: [{ destinationAddress: ADMIN_RAW, valueNano: EXPECTED.toString() }] }));
    const r = await verifyBuyPayment(client, { ...input, expectedDestinationAddress: ADMIN_FRIENDLY });
    expect(r.valid).toBe(true);
  });
});
