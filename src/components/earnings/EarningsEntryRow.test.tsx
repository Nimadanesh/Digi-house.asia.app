import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EarningsEntryRow } from "@/components/earnings/EarningsEntryRow";
import type { EarningsEntry } from "@/types/earnings";

const paidEntry: EarningsEntry = {
  id: "e1",
  userId: "u1",
  propertyId: "p1",
  weekOf: "2026-07-20T00:00:00Z",
  amountUsd: 1500, // $15.00
  tonAmount: 7_500_000,
  shareRatio: 0.075,
  status: "paid",
  txHash: "simulated:abc-def-12345",
};

const pendingEntry: EarningsEntry = {
  ...paidEntry,
  id: "e2",
  status: "pending",
  txHash: undefined,
};

describe("EarningsEntryRow — MVP honesty contract", () => {
  it("a paid entry renders the 'Paid' success pill + muted 'simulated' badge", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside Marina Penthouse" weeklyRentPoolUsd={20000} />);
    expect(screen.getByText("Paid")).toHaveClass("text-success");
    expect(screen.getByText("simulated")).toHaveClass("text-muted-foreground");
  });

  it("a paid entry, expanded, shows the 'Simulated payout · tx hash is a placeholder' line", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside" weeklyRentPoolUsd={20000} />);
    fireEvent.click(screen.getByRole("button"));
    // The disclosure line (R-6.6 honesty disclosure):
    expect(screen.getByText(/Simulated payout · tx hash is a placeholder/)).toBeInTheDocument();
    // The txHash is shown as a prefix slice:
    expect(screen.getByText(/\(simulated:abc-def-12345…\)/)).toBeInTheDocument();
  });

  it("a pending entry renders the 'Pending' warning pill and NO 'simulated' badge", () => {
    render(<EarningsEntryRow entry={pendingEntry} propertyName="Alfama Terrace" weeklyRentPoolUsd={25000} />);
    expect(screen.getByText("Pending")).toHaveClass("text-warning");
    expect(screen.queryByText("simulated")).not.toBeInTheDocument();
    expect(screen.queryByText("Paid")).not.toBeInTheDocument();
  });

  it("a pending entry, expanded, does NOT show the simulated-txHash line", () => {
    render(<EarningsEntryRow entry={pendingEntry} propertyName="Alfama" weeklyRentPoolUsd={25000} />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/Simulated payout/)).not.toBeInTheDocument();
  });

  it("a paid entry shows the amount in tabular-nums (tnum class)", () => {
    render(<EarningsEntryRow entry={paidEntry} propertyName="Bayside" weeklyRentPoolUsd={20000} />);
    const amount = screen.getByText("$15.00");
    expect(amount).toHaveClass("tnum");
  });
});