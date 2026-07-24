import { describe, expect, it } from "vitest";
import { buildBuyMessage, makeSyntheticTxHash, sendTx } from "@/lib/ton/sendTx";

const GOOD_ADDRESS = "EQARULx2r6JmOuMoQn7jVr8m9Rrjv0s4kq5t8s7q5t8s4kq5";

describe("sendTx pure logic", () => {
  it("buildBuyMessage produces a valid SendTransactionRequest shape", () => {
    const req = buildBuyMessage({
      toFriendlyAddress: GOOD_ADDRESS,
      nanoTon: 10_000_000n,
      memo: "buy 5 shares",
    });
    expect(req.validUntil).toBeGreaterThan(Math.floor(Date.now() / 1000));
    expect(req.messages).toHaveLength(1);
    expect(req.messages[0].address).toBe(GOOD_ADDRESS);
    expect(req.messages[0].amount).toBe("10000000");
  });

  it("buildBuyMessage omits payload when no memo is supplied", () => {
    const req = buildBuyMessage({
      toFriendlyAddress: GOOD_ADDRESS,
      nanoTon: 1n,
    });
    expect("payload" in req.messages[0]).toBe(false);
  });

  it("makeSyntheticTxHash returns the 'simulated:' prefix required for MVP honesty", () => {
    const h = makeSyntheticTxHash();
    expect(h.startsWith("simulated:")).toBe(true);
    expect(h.length).toBeGreaterThan("simulated:".length);
  });

  it("makeSyntheticTxHash is unique across calls", () => {
    const a = makeSyntheticTxHash();
    const b = makeSyntheticTxHash();
    expect(a).not.toBe(b);
  });

  it("sendTx rejects a missing TonConnectUI with a clear error", async () => {
    const r = await sendTx(
      null,
      buildBuyMessage({ toFriendlyAddress: GOOD_ADDRESS, nanoTon: 1n }),
    );
    expect(r.ok).toBe(false);
    expect(r.txHash).toBe("");
    expect(r.error).toMatch(/no wallet|ui/i);
  });
});