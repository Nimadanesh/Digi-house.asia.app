// File responsibility: pure filter tests — new kinds map to categories, legacy kinds fold in.
import { describe, expect, it } from "vitest";
import {
  filterTransactions,
  TRANSACTION_CHIP_IDS,
} from "@/lib/transaction-filter";
import type { Transaction } from "@/types/transaction";

function tx(id: string, kind: Transaction["kind"]): Transaction {
  return {
    id,
    kind,
    userId: "u1",
    amountUsd: 100,
    status: "success",
    createdAt: "2026-01-01T00:00:00Z",
  };
}

const rows = [
  tx("a", "buy"),
  tx("b", "instant_sell"),
  tx("c", "trade_buy"),
  tx("d", "trade_sell"),
  tx("e", "sell"), // legacy → trade
  tx("f", "yield_weekly"),
  tx("g", "yield_monthly"),
  tx("h", "earnings"), // legacy → yield
  tx("i", "withdraw"),
];

describe("filterTransactions", () => {
  it("returns every row for 'all'", () => {
    expect(filterTransactions(rows, "all")).toHaveLength(9);
  });

  it("filters primary buys", () => {
    expect(filterTransactions(rows, "buy").map((t) => t.id)).toEqual(["a"]);
  });

  it("filters instant sells", () => {
    expect(filterTransactions(rows, "instant_sell").map((t) => t.id)).toEqual([
      "b",
    ]);
  });

  it("folds secondary trades + legacy sells into 'trade'", () => {
    expect(filterTransactions(rows, "trade").map((t) => t.id)).toEqual([
      "c",
      "d",
      "e",
    ]);
  });

  it("folds monthly/weekly yield + legacy earnings into 'yield'", () => {
    expect(filterTransactions(rows, "yield").map((t) => t.id)).toEqual([
      "f",
      "g",
      "h",
    ]);
  });

  it("filters withdrawals", () => {
    expect(filterTransactions(rows, "withdraw").map((t) => t.id)).toEqual([
      "i",
    ]);
  });

  it("exposes the expected chip order", () => {
    expect(TRANSACTION_CHIP_IDS).toEqual([
      "all",
      "buy",
      "instant_sell",
      "trade",
      "yield",
      "withdraw",
    ]);
  });
});
