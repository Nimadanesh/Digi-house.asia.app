// Rental Performance (Slice: all-24 data completion) — the block tells the
// rental story from canonical data only: observed nightly rate stays visible,
// derived rows stay pending until occupancy/income are reported. No mock annual
// rent, no "Projected annual rent" wording.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RentalStoryBlock } from "@/components/property/RentalStoryBlock";

describe("RentalStoryBlock — canonical rental performance", () => {
  it("shows the observed nightly display with provenance, costs/net pending", () => {
    render(
      <RentalStoryBlock nightlyDisplay="$52,200–$75,800+" onShowIncome={() => {}} />,
    );
    expect(screen.getByTestId("rental-story")).toBeInTheDocument();
    expect(screen.getByTestId("rental-story-rent")).toHaveTextContent("$52,200–$75,800+");
    expect(
      screen.getByTestId("rental-story-rent").querySelector('[data-testid="provenance-info"]'),
    ).toHaveAttribute("data-provenance", "observed");
    expect(screen.getByTestId("rental-story-costs")).toHaveTextContent("Not yet reported");
    expect(screen.getByTestId("rental-story-net")).toHaveTextContent("Not yet reported");
  });

  it("never uses projected-annual-rent wording or mock rent figures", () => {
    render(
      <RentalStoryBlock nightlyDisplay="$52,200–$75,800+" onShowIncome={() => {}} />,
    );
    expect(screen.queryByText("Projected annual rent")).not.toBeInTheDocument();
    expect(screen.queryByText("Projected")).not.toBeInTheDocument();
    expect(screen.queryByText("$5,200.00")).not.toBeInTheDocument();
  });

  it("renders pending treatment without a nightly display (never crashes)", () => {
    render(<RentalStoryBlock nightlyDisplay={null} onShowIncome={() => {}} />);
    expect(screen.getByTestId("rental-story-rent")).toHaveTextContent("Data pending");
  });

  it("switches to the Income tab on action", () => {
    const onShowIncome = vi.fn();
    render(<RentalStoryBlock nightlyDisplay="$52,200–$75,800+" onShowIncome={onShowIncome} />);
    fireEvent.click(screen.getByTestId("rental-story-see-income"));
    expect(onShowIncome).toHaveBeenCalledTimes(1);
  });
});
