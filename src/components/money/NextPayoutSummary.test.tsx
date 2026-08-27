import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NextPayoutSummary } from "@/components/money/NextPayoutSummary";

vi.mock("@/hooks/useSharedNowMs", () => ({
  useSharedNowMs: () => 1_700_000_000_000, // a fixed epoch (a Friday)
}));

describe("NextPayoutSummary", () => {
  it("renders the next Sunday date and estimated amount, static (no countdown)", () => {
    render(<NextPayoutSummary projectedUsd={3375} />);
    const card = screen.getByTestId("next-payout-summary");
    expect(card).toHaveAttribute("href", "/earnings");
    expect(screen.getByText("Next Payout")).toBeInTheDocument();
    // Static Sunday display rule — a date, never a ticking timer.
    expect(screen.getByTestId("next-payout-date")).toHaveTextContent(/sun/i);
    expect(screen.getByTestId("next-payout-amount")).toHaveTextContent("$33.75");
    expect(screen.queryByTestId("next-payout-timer")).not.toBeInTheDocument();
  });

  it("formats minor-unit cents to a dollar figure", () => {
    render(<NextPayoutSummary projectedUsd={12_345} />);
    expect(screen.getByTestId("next-payout-amount")).toHaveTextContent("$123.45");
  });

  it("calls the haptic on navigate when provided", () => {
    const onNavigateHaptic = vi.fn();
    render(<NextPayoutSummary projectedUsd={100} onNavigateHaptic={onNavigateHaptic} />);
    screen.getByTestId("next-payout-summary").click();
    expect(onNavigateHaptic).toHaveBeenCalledTimes(1);
  });
});