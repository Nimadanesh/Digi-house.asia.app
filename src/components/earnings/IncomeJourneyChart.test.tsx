import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { IncomeJourneyChart } from "@/components/earnings/IncomeJourneyChart";
import type { EarningsEntry } from "@/types/earnings";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function entry(overrides: Partial<EarningsEntry>): EarningsEntry {
  return {
    id: "e",
    userId: "u",
    propertyId: "prop-a",
    weekOf: "2026-07-13T00:00:00Z",
    amountUsd: 1_000,
    tonAmount: 0,
    shareRatio: 0.1,
    status: "paid",
    ...overrides,
  };
}

const ENTRIES: EarningsEntry[] = [
  entry({ id: "a1", propertyId: "prop-a", weekOf: "2026-07-06T00:00:00Z", amountUsd: 3_000, status: "paid" }),
  entry({ id: "a2", propertyId: "prop-a", weekOf: "2026-07-13T00:00:00Z", amountUsd: 1_500, status: "paid" }),
  entry({ id: "b2", propertyId: "prop-b", weekOf: "2026-07-13T00:00:00Z", amountUsd: 500, status: "pending" }),
];

const NAMES = new Map([
  ["prop-a", { name: "Villa A" }],
  ["prop-b", { name: "Villa B" }],
]) as never;

describe("IncomeJourneyChart — explorable income over time", () => {
  it("renders ranges, paid/projected columns and the honesty caption", () => {
    render(<IncomeJourneyChart entries={ENTRIES} propertyById={NAMES} />);
    expect(screen.getByTestId("income-journey")).toBeInTheDocument();
    expect(screen.getByTestId("journey-ranges")).toBeInTheDocument();
    // 12W window: 3 data weeks + 9 honest empty pads.
    expect(screen.getAllByTestId("journey-bar")).toHaveLength(12);
    expect(screen.getByTestId("journey-legend")).toBeInTheDocument();
  });

  it("selects the latest data week by default with a full detail panel", () => {
    render(<IncomeJourneyChart entries={ENTRIES} propertyById={NAMES} accruedUsd={4_200} />);
    const detail = screen.getByTestId("journey-detail");
    // Latest data week holds $1,500 paid + $500 projected across 2 estates.
    expect(detail).toHaveTextContent("$15.00");
    expect(detail).toHaveTextContent("$5.00");
    expect(detail).toHaveTextContent("Villa A");
    expect(detail).toHaveTextContent("Villa B");
    expect(detail).toHaveTextContent("$42.00");
  });

  it("tapping a column updates the detail panel", () => {
    render(<IncomeJourneyChart entries={ENTRIES} propertyById={NAMES} />);
    const bars = screen.getAllByTestId("journey-bar");
    fireEvent.click(bars[10]); // first data week: $30.00 paid, no projection
    const detail = screen.getByTestId("journey-detail");
    expect(detail).toHaveTextContent("$30.00");
    expect(detail).toHaveTextContent("Villa A");
    expect(detail).not.toHaveTextContent("Villa B");
  });

  it("empty pads explain themselves instead of claiming $0", () => {
    render(<IncomeJourneyChart entries={ENTRIES} propertyById={NAMES} />);
    fireEvent.click(screen.getAllByTestId("journey-bar")[0]);
    expect(screen.getByTestId("journey-detail")).toHaveTextContent("No distributions this week");
  });

  it("ALL range shows data weeks only; constrained caption is honest", () => {
    render(<IncomeJourneyChart entries={ENTRIES} propertyById={NAMES} />);
    fireEvent.click(screen.getByTestId("journey-range-ALL"));
    expect(screen.getAllByTestId("journey-bar")).toHaveLength(2);
    fireEvent.click(screen.getByTestId("journey-range-12W"));
    expect(screen.getAllByTestId("journey-bar")).toHaveLength(12);
    expect(screen.getByTestId("journey-range-note")).toBeInTheDocument();
  });

  it("columns are real buttons with accessible names", () => {
    render(<IncomeJourneyChart entries={ENTRIES} propertyById={NAMES} />);
    const bars = screen.getAllByTestId("journey-bar");
    for (const bar of bars) {
      expect(bar.tagName).toBe("BUTTON");
      expect(bar.getAttribute("aria-label")).toBeTruthy();
    }
    expect(screen.getByTestId("journey-detail")).toHaveAttribute("aria-live", "polite");
  });
});
