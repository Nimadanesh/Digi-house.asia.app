import { describe, it, expect, vi, afterEach } from "vitest";
import { pollVerifyAndSettle } from "@/hooks/useBuyShares";
import type { BuyVerifyResult } from "@/types/buy";

const { verifyAndSettle } = vi.hoisted(() => ({
  verifyAndSettle: vi.fn<() => Promise<BuyVerifyResult>>(),
}));

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({ send: vi.fn() }),
}));

vi.mock("@/lib/api/getRepo", () => ({
  getRepo: () => ({ tx: { verifyAndSettle: () => verifyAndSettle() } }),
}));

function pending(): BuyVerifyResult {
  return { intentId: "intent_1", status: "pending_confirmation", reason: "tx_not_found" };
}

describe("pollVerifyAndSettle", () => {
  afterEach(() => {
    vi.useRealTimers();
    verifyAndSettle.mockReset();
  });

  it("returns immediately when the payment is already settled", async () => {
    verifyAndSettle.mockResolvedValue({ intentId: "intent_1", status: "settled", txHash: "h".repeat(64) });
    const result = await pollVerifyAndSettle("intent_1");
    expect(result.status).toBe("settled");
    expect(verifyAndSettle).toHaveBeenCalledTimes(1);
  });

  it("polls until settled when still confirming", async () => {
    vi.useFakeTimers();
    verifyAndSettle
      .mockResolvedValueOnce(pending())
      .mockResolvedValueOnce(pending())
      .mockResolvedValueOnce({ intentId: "intent_1", status: "settled" });

    const result = pollVerifyAndSettle("intent_1");
    await vi.advanceTimersByTimeAsync(9000);
    expect((await result).status).toBe("settled");
    expect(verifyAndSettle).toHaveBeenCalledTimes(3);
  });

  it("throws a clear, non-alarming message when verification times out", async () => {
    vi.useFakeTimers();
    verifyAndSettle.mockResolvedValue(pending());

    const promise = pollVerifyAndSettle("intent_1");
    // Attach the rejection handler before advancing timers so the throw is never unhandled.
    const assertion = expect(promise).rejects.toThrow(
      /still confirming on the blockchain.*no action needed/i,
    );
    await vi.advanceTimersByTimeAsync(100_000);
    await assertion;
  });

  it("throws a friendly message on a final verification failure", async () => {
    verifyAndSettle.mockResolvedValue({
      intentId: "intent_1",
      status: "verification_failed",
      reason: "payer_mismatch",
    });
    await expect(pollVerifyAndSettle("intent_1")).rejects.toThrow(
      /didn't come from your connected wallet/i,
    );
  });
});
