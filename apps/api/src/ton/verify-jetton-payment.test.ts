import { describe, expect, it } from "vitest";
import type {
  OnChainJettonTransfer,
  OnChainTx,
  TonTxClient,
} from "./tx-client.js";
import { verifyJettonBuyPayment } from "./verify-jetton-payment.js";

const ADMIN_RAW = "0:1111111111111111111111111111111111111111111111111111111111111111";
const MASTER_RAW = "0:2222222222222222222222222222222222222222222222222222222222222222";
const HASH = "a".repeat(64);
const EXPECTED = 5_000_000_000n; // 5_000 USDT (6 decimals)

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
const MASTER_FRIENDLY = friendly(MASTER_RAW);

function clientOf(over: Partial<TonTxClient> = {}): TonTxClient {
  return {
    async getTransactionByMessageHash() {
      return { kind: "found" as const, tx: txRow() };
    },
    async getJettonTransfer() {
      return { kind: "found" as const, transfer: jettonTransfer() };
    },
    async getJettonWalletAddress() {
      return { kind: "found" as const, address: ADMIN_RAW };
    },
    ...over,
  };
}

function txRow(over: Partial<OnChainTx> = {}): OnChainTx {
  return {
    hash: HASH,
    success: true,
    utime: Math.floor(Date.now() / 1000),
    outMessages: [{ destinationAddress: ADMIN_RAW, valueNano: "100000000" }],
    ...over,
  };
}

function jettonTransfer(over: Partial<OnChainJettonTransfer> = {}): OnChainJettonTransfer {
  return {
    status: "ok",
    jettonMasterAddress: MASTER_RAW,
    recipientAddress: ADMIN_RAW,
    amount: EXPECTED.toString(),
    utime: Math.floor(Date.now() / 1000),
    ...over,
  };
}

describe("verifyJettonBuyPayment", () => {
  const input = {
    txHash: HASH,
    expectedJettonMasterAddress: MASTER_RAW,
    expectedRecipientAddress: ADMIN_RAW,
    expectedAmount: EXPECTED,
    referenceTimeMs: Date.now(),
    maxAgeMs: 30 * 60 * 1000,
  };

  it("returns valid with the actual jetton amount for a matching transfer", async () => {
    const r = await verifyJettonBuyPayment(clientOf(), input);
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.actualJettonAmount).toBe(EXPECTED.toString());
  });

  it("accepts an overpayment (amount >= expected)", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return {
          kind: "found" as const,
          transfer: jettonTransfer({ amount: (EXPECTED + 1n).toString() }),
        };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r.valid).toBe(true);
  });

  it("tx_not_found when the message is not indexed yet (retryable)", async () => {
    const client = clientOf({
      async getTransactionByMessageHash() {
        return { kind: "not_found" };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "tx_not_found" });
  });

  it("api_unavailable on transaction lookup error (retryable)", async () => {
    const client = clientOf({
      async getTransactionByMessageHash() {
        return { kind: "error" };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "api_unavailable" });
  });

  it("tx_failed when the source transaction did not succeed", async () => {
    const client = clientOf({
      async getTransactionByMessageHash() {
        return { kind: "found" as const, tx: txRow({ success: false }) };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "tx_failed" });
  });

  it("tx_too_old when the transfer predates the recency window", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return {
          kind: "found" as const,
          transfer: jettonTransfer({ utime: Math.floor((Date.now() - 31 * 60 * 1000) / 1000) }),
        };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe("tx_too_old");
  });

  it("no_jetton_transfer when the trace has no JettonTransfer action", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return { kind: "not_found" };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe("no_jetton_transfer");
  });

  it("api_unavailable when the event lookup itself errors (retryable)", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return { kind: "error" };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "api_unavailable" });
  });

  it("tx_failed when the transfer action failed", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return { kind: "found" as const, transfer: jettonTransfer({ status: "failed" }) };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r).toEqual({ valid: false, reason: "tx_failed" });
  });

  it("jetton_mismatch when the token is not the expected master", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return {
          kind: "found" as const,
          transfer: jettonTransfer({
            jettonMasterAddress: "0:3333333333333333333333333333333333333333333333333333333333333333",
          }),
        };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe("jetton_mismatch");
  });

  it("recipient_mismatch when the funds did not reach the admin wallet", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return {
          kind: "found" as const,
          transfer: jettonTransfer({
            recipientAddress: "0:4444444444444444444444444444444444444444444444444444444444444444",
          }),
        };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe("recipient_mismatch");
  });

  it("amount_insufficient when the transferred jetton amount is below expected", async () => {
    const client = clientOf({
      async getJettonTransfer() {
        return {
          kind: "found" as const,
          transfer: jettonTransfer({ amount: (EXPECTED - 1n).toString() }),
        };
      },
    });
    const r = await verifyJettonBuyPayment(client, input);
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.reason).toBe("amount_insufficient");
  });

  it("matches master + recipient across friendly/raw forms", async () => {
    const r = await verifyJettonBuyPayment(clientOf(), {
      ...input,
      expectedJettonMasterAddress: MASTER_FRIENDLY,
      expectedRecipientAddress: ADMIN_FRIENDLY,
    });
    expect(r.valid).toBe(true);
  });
});
