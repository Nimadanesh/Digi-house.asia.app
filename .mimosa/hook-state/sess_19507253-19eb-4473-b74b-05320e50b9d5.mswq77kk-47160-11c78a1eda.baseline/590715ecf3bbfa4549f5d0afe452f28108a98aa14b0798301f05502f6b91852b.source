import { describe, expect, it, vi } from "vitest";
import { Cell } from "@ton/core";
import type { TonConnectUI } from "@tonconnect/ui";
import { buildBuyMessage, sendTx } from "@/lib/ton/sendTx";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";

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

  it("buildBuyMessage sends a pre-built jetton payload verbatim (USDT)", () => {
    const req = buildBuyMessage({
      toFriendlyAddress: GOOD_ADDRESS,
      nanoTon: 100_000_000n,
      payload: "te6ccgEBAQEA-jetton-transfer-body",
      memo: "buy 5 shares",
    });
    expect(req.messages[0].amount).toBe("100000000");
    // The jetton_transfer payload wins over the memo comment.
    expect(req.messages[0].payload).toBe("te6ccgEBAQEA-jetton-transfer-body");
  });

  it("buildBuyMessage falls back to the memo comment when no payload is given", () => {
    const req = buildBuyMessage({
      toFriendlyAddress: GOOD_ADDRESS,
      nanoTon: 1n,
      memo: "buy 5 shares",
    });
    expect(req.messages[0].payload).toBeTruthy();
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

  it("sendTx derives a REAL txHash (sha256 of the boc) from the wallet response", async () => {
    const boc = new Cell().toBoc().toString("base64");
    const ui = {
      sendTransaction: vi.fn().mockResolvedValue({ boc }),
    } as unknown as TonConnectUI;
    const r = await sendTx(
      ui,
      buildBuyMessage({ toFriendlyAddress: GOOD_ADDRESS, nanoTon: 1n }),
    );
    expect(r.ok).toBe(true);
    expect(r.boc).toBe(boc);
    expect(r.txHash).toMatch(/^[0-9a-f]{64}$/);
    expect(r.txHash.startsWith("simulated:")).toBe(false);
  });

  it("sendTx reports failure when the wallet returns no boc", async () => {
    const ui = {
      sendTransaction: vi.fn().mockResolvedValue({}),
    } as unknown as TonConnectUI;
    const r = await sendTx(
      ui,
      buildBuyMessage({ toFriendlyAddress: GOOD_ADDRESS, nanoTon: 1n }),
    );
    expect(r.ok).toBe(false);
    expect(r.txHash).toBe("");
    expect(r.error).toMatch(/no boc/i);
  });
});