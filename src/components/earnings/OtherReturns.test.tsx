import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OtherReturns } from "@/components/earnings/OtherReturns";
import type { ListingGain } from "@/lib/income-view-model";

function gain(overrides: Partial<ListingGain>): ListingGain {
  return {
    orderId: "ord-1",
    propertyId: "prop-a",
    title: "Villa A",
    quantity: 10,
    priceUsd: 12_500,
    status: "open",
    acquisitionCostUsd: 120_000,
    gainLossUsd: 5_000,
    direction: "gain",
    sharesRemaining: 150,
    remainingRatio: 0.15,
    ...overrides,
  };
}

describe("OtherReturns — non-rental returns stay separate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a skeleton while loading, never a fake empty", () => {
    render(<OtherReturns gains={undefined} />);
    expect(screen.getByTestId("other-loading")).toBeInTheDocument();
    expect(screen.queryByTestId("other-returns")).not.toBeInTheDocument();
  });

  it("shows plan, appreciation and secondary sections without inventing numbers", () => {
    render(<OtherReturns gains={[]} />);
    expect(screen.getByTestId("other-returns")).toBeInTheDocument();
    expect(screen.getByTestId("other-plan")).toHaveTextContent("No investment plans configured");
    expect(screen.getByTestId("other-appreciation")).toHaveTextContent("Pending");
    expect(screen.getByTestId("other-secondary")).toHaveTextContent("No open listings");
  });

  it("lists open sell positions with proposed gain — never as income", () => {
    render(<OtherReturns gains={[gain({})]} />);
    const row = screen.getByTestId("other-secondary-ord-1");
    expect(row).toHaveTextContent("Villa A");
    expect(row).toHaveTextContent("+$50.00");
    expect(row).toHaveTextContent("Gain");
    expect(screen.queryByText("No open listings")).not.toBeInTheDocument();
    // Proposed gain stays in this section — paid income is untouched.
    expect(screen.queryByTestId("other-secondary-ord-1")).not.toHaveTextContent("Received");
  });

  it("loss and unknown basis render honestly", () => {
    render(
      <OtherReturns
        gains={[
          gain({ orderId: "l", direction: "loss", gainLossUsd: -20_000 }),
          gain({ orderId: "u", direction: "unknown", acquisitionCostUsd: null, gainLossUsd: null }),
        ]}
      />,
    );
    expect(screen.getByTestId("other-secondary-l")).toHaveTextContent("Loss");
    expect(screen.getByTestId("other-secondary-u")).toHaveTextContent("—");
  });
});
