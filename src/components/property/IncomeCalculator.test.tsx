import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Listing } from "@/types/property";
import { IncomeCalculator } from "@/components/property/IncomeCalculator";

const listing: Listing = {
  id: "prop-marina-vista-4b",
  title: "Marina Vista Apt 4B",
  location: "Dubai Marina, UAE",
  description: "Waterfront one-bedroom.",
  images: ["/images/properties/p1.png"],
  totalShares: 1000,
  sharePriceUsd: 8000,
  status: "funding",
  ownerWalletAddress: "EQAtest",
  annualRentUsd: 520000,
  createdAt: "2026-01-12T09:00:00Z",
  sharesSold: 640,
  sharesRemaining: 360,
  fundingProgressRatio: 0.64,
  monthlyYieldRate: 6,
  totalValueUsd: 8_000_000,
  meta: {
    sizeSqm: 72,
    yearBuilt: 2019,
    propertyType: "Apartment",
    rentalStatus: "rented",
    leaseUntil: "2026-12-31",
    activeTenant: true,
    tokenizationDocUrl: "#tokenization-demo",
  },
  rentalHistory: [],
};

function renderCalc(overrides?: { ownedShares?: number; shares?: number }) {
  const onBuy = vi.fn();
  const onSharesChange = vi.fn();
  render(
    <IncomeCalculator
      listing={listing}
      shares={overrides?.shares ?? 1}
      onSharesChange={onSharesChange}
      ownedShares={overrides?.ownedShares ?? 0}
      onBuy={onBuy}
    />,
  );
  return { onBuy, onSharesChange };
}

describe("IncomeCalculator — redesign Phase 2", () => {
  it("renders title, slider, editable input and scenario segment", () => {
    renderCalc();
    expect(screen.getByText("How much can I earn?")).toBeInTheDocument();
    expect(screen.getByTestId("income-slider")).toBeInTheDocument();
    expect(screen.getByTestId("income-shares-input")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-base")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("scenario-conservative")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-optimistic")).toBeInTheDocument();
  });

  it("shows monthly + yearly projection from existing yield math", () => {
    renderCalc({ shares: 10 });
    // positionYieldUsd: invested 10 × $80 → monthly = invested × 6% = $48.00
    expect(screen.getByTestId("calc-monthly")).toHaveTextContent("$48.00");
    expect(screen.getByTestId("calc-yearly")).toHaveTextContent("≈ $576.00 / year");
    expect(screen.getByText(/After platform fees · Locked shares start earning from day 1/)).toBeInTheDocument();
  });

  it("Buy CTA calls onBuy with current share count and total cost", () => {
    const { onBuy } = renderCalc({ shares: 10 });
    expect(screen.getByTestId("calc-buy")).toHaveTextContent(/Buy 10 shares – \$800\.00/);
    fireEvent.click(screen.getByTestId("calc-buy"));
    expect(onBuy).toHaveBeenCalledWith(10);
  });

  it("prefills at owned shares and raises the floor", () => {
    renderCalc({ ownedShares: 40 });
    expect(screen.getByTestId("owned-pill")).toHaveTextContent("You own 40");
    const slider = screen.getByTestId("income-slider") as HTMLInputElement;
    expect(slider.min).toBe("40");
    expect(screen.getByTestId("income-shares-input")).toHaveValue("40");
    expect(screen.getByTestId("calc-buy")).toHaveTextContent(/Buy 40 shares/);
  });

  it("numeric input commits digits through onSharesChange", () => {
    const { onSharesChange } = renderCalc({ shares: 5 });
    const input = screen.getByTestId("income-shares-input");
    fireEvent.change(input, { target: { value: "12" } });
    expect(onSharesChange).toHaveBeenCalledWith(12);
  });
});
