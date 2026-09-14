// File responsibility: tests for the single primary-buy total computation
// shared by the summary sheet and the MainButton confirm label.
import { describe, expect, it } from "vitest";
import { previewBuyQuote } from "@/lib/buy-quote";
import { DEFAULT_FEE_TIERS } from "@/lib/mock/fees";

describe("previewBuyQuote", () => {
  it("computes principal + tiered commission + payable in integer cents", () => {
    // 10 shares @ $125.00 = $1,250.00 principal → 2.5% tier → $31.25 fee.
    const quote = previewBuyQuote(10, 12500, DEFAULT_FEE_TIERS);
    expect(quote.totalUsd).toBe(125_000);
    expect(quote.feesUsd).toBe(3_125);
    expect(quote.totalPayableUsd).toBe(128_125);
  });

  it("previews $0 fees when no tier covers the amount (server is authoritative)", () => {
    const quote = previewBuyQuote(10, 12500, []);
    expect(quote.totalUsd).toBe(125_000);
    expect(quote.feesUsd).toBe(0);
    expect(quote.totalPayableUsd).toBe(125_000);
  });

  it("handles zero quantity without negative or fractional cents", () => {
    const quote = previewBuyQuote(0, 12500, DEFAULT_FEE_TIERS);
    expect(quote).toEqual({ totalUsd: 0, feesUsd: 0, totalPayableUsd: 0 });
  });
});
