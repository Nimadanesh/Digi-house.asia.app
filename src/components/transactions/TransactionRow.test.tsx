import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import type { Transaction } from "@/types/transaction";

function tx(over: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    kind: "buy",
    userId: "u1",
    amountUsd: 100_000,
    status: "success",
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("TransactionRow", () => {
  it("renders the instant-sell label", () => {
    render(<TransactionRow transaction={tx({ kind: "instant_sell" })} />);
    expect(screen.getByText("Instant sell")).toBeInTheDocument();
  });

  it("renders the weekly-yield label", () => {
    render(<TransactionRow transaction={tx({ kind: "yield_weekly" })} />);
    expect(screen.getByText("Weekly yield")).toBeInTheDocument();
  });

  it("shows the fee line only when expanded", () => {
    render(<TransactionRow transaction={tx({ kind: "trade_buy", feeUsd: 2_520 })} />);
    expect(screen.queryByText("Fee")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Fee")).toBeInTheDocument();
    expect(screen.getByText("$25.20")).toBeInTheDocument();
  });

  it("hides the fee line when feeUsd is absent", () => {
    render(<TransactionRow transaction={tx({ kind: "buy" })} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("Fee")).not.toBeInTheDocument();
  });
});
