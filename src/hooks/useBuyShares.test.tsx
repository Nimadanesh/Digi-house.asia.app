import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { pollVerifyAndSettle, useBuyShares, UsdtUnavailableError } from "@/hooks/useBuyShares";
import { ApiError } from "@/lib/api/http/client";
import type { BuyVerifyResult } from "@/types/buy";

const { verifyAndSettle, prepareBuy, confirmBuy, send } = vi.hoisted(() => ({
  verifyAndSettle: vi.fn<() => Promise<BuyVerifyResult>>(),
  prepareBuy: vi.fn(),
  confirmBuy: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/hooks/useTonConnect", () => ({
  useTonConnect: () => ({ send: (...args: unknown[]) => send(...args) }),
}));

vi.mock("@/lib/api/getRepo", () => ({
  getRepo: () => ({
    tx: {
      verifyAndSettle: () => verifyAndSettle(),
      prepareBuy: (...args: unknown[]) => prepareBuy(...args),
      confirmBuy: (...args: unknown[]) => confirmBuy(...args),
    },
  }),
}));

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const PREP = {
  intentId: "intent_1",
  message: { address: "EQadmin", amount: "100000000" },
};

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

describe("useBuyShares mutation", () => {
  beforeEach(() => {
    prepareBuy.mockReset().mockResolvedValue(PREP);
    confirmBuy.mockReset().mockResolvedValue({ intentId: "intent_1", status: "confirmed" });
    verifyAndSettle.mockReset().mockResolvedValue({ intentId: "intent_1", status: "settled" });
    send.mockReset().mockResolvedValue({ ok: true, txHash: "h".repeat(64) });
  });

  const input = { propertyId: "test-a", quantity: 2, priceUsdPerShare: 8000, currency: "TON" as const };

  it("runs prepare → send → confirm → settle and returns the send result", async () => {
    const { result } = renderHook(() => useBuyShares(), { wrapper });
    let out: unknown;
    await act(async () => {
      out = await result.current.mutateAsync(input);
    });
    expect(prepareBuy).toHaveBeenCalledWith(input);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ toFriendlyAddress: "EQadmin", memo: "buy 2 shares of test-a" }),
    );
    expect(confirmBuy).toHaveBeenCalledWith({ intentId: "intent_1", txHash: "h".repeat(64) });
    expect(out).toEqual({ ok: true, txHash: "h".repeat(64) });
    expect(result.current.phase).toBe("idle");
  });

  it("maps USDT payment_method_unavailable to UsdtUnavailableError", async () => {
    prepareBuy.mockRejectedValueOnce(new ApiError(409, "no usdt", "payment_method_unavailable"));
    const { result } = renderHook(() => useBuyShares(), { wrapper });
    await expect(
      result.current.mutateAsync({ ...input, currency: "USDT" }),
    ).rejects.toBeInstanceOf(UsdtUnavailableError);
    expect(send).not.toHaveBeenCalled();
  });

  it("rethrows non-USDT and other-code prepare failures untouched", async () => {
    prepareBuy.mockRejectedValueOnce(new ApiError(409, "paused", "sale_paused"));
    const { result } = renderHook(() => useBuyShares(), { wrapper });
    await expect(result.current.mutateAsync({ ...input, currency: "USDT" })).rejects.toMatchObject({
      code: "sale_paused",
    });
  });

  it("throws the wallet rejection message when the user cancels the send", async () => {
    send.mockResolvedValueOnce({ ok: false, txHash: "" });
    const { result } = renderHook(() => useBuyShares(), { wrapper });
    await expect(result.current.mutateAsync(input)).rejects.toThrow(
      /wallet rejected the transaction/i,
    );
    expect(confirmBuy).not.toHaveBeenCalled();
  });

  it("moves through sending → verifying phases while in flight", async () => {
    let releaseSend!: (v: unknown) => void;
    send.mockReturnValueOnce(new Promise((resolve) => { releaseSend = resolve as (v: unknown) => void; }));
    const { result } = renderHook(() => useBuyShares(), { wrapper });
    let done!: Promise<unknown>;
    act(() => {
      done = result.current.mutateAsync(input).catch(() => null);
    });
    await waitFor(() => expect(result.current.phase).toBe("sending"));
    await act(async () => {
      releaseSend({ ok: true, txHash: "h".repeat(64) });
      await done;
    });
    expect(result.current.phase).toBe("idle");
  });
});
