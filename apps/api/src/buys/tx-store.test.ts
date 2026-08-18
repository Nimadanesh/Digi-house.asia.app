import { describe, expect, it } from "vitest";
import { mapKind } from "./tx-store.js";

describe("mapKind", () => {
  it("passes every known kind through verbatim", () => {
    const known = [
      "buy",
      "sell",
      "earnings",
      "withdraw",
      "instant_sell",
      "trade_buy",
      "trade_sell",
      "yield_monthly",
      "yield_weekly",
    ] as const;
    for (const k of known) {
      expect(mapKind(k)).toBe(k);
    }
  });

  it("falls back to 'buy' for unknown strings", () => {
    expect(mapKind("bogus")).toBe("buy");
    expect(mapKind("")).toBe("buy");
    expect(mapKind("BUY")).toBe("buy");
    expect(mapKind("instantSell")).toBe("buy");
    expect(mapKind("trade")).toBe("buy");
    expect(mapKind("yield")).toBe("buy");
    expect(mapKind("withdrawal")).toBe("buy");
  });
});
