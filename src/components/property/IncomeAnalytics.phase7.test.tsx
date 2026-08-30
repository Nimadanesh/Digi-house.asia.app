import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { IncomeAnalytics } from "./IncomeAnalytics";
import type { Listing } from "@/types/property";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) =>
    (key: string) => {
      const full = namespace ? `${namespace}.${key}` : key;
      const table: Record<string, string> = {
        "property.incomeHistoryTitle": "Income history",
        "property.cumulativeYieldPerShare": "Cumulative yield per share",
        "property.incomeMonthsWord": "months",
        "property.perShareWord": "per share",
        "property.poolWord": "pool",
        "property.incomeTapHint": "Tap a bar for that month's payout detail.",
        "property.payoutHistoryTitle": "Payout history",
        "property.payoutHistoryNote": "Simulated income history.",
        "property.incomeRatiosTitle": "Real-estate metrics",
        "property.grossYield": "Gross yield",
        "property.annualYieldRate": "Annual yield rate",
        "property.incomeRatiosNote": "From rent and value only.",
        "property.incomeProjectionsTitle": "Projected earnings",
        "property.incomeProjectionsNote": "Use the income calculator on Overview.",
      };
      return table[full] ?? full;
    },
}));

import { getPropertyAnalytics } from "@/lib/property-analytics";
import { usd } from "@/lib/format";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "test-prop",
    title: "Test Property",
    location: "Test City, Test Country",
    description: "Test description",
    images: [],
    totalShares: 2500,
    sharePriceUsd: 8000,
    status: "resale",
    ownerWalletAddress: "0xtest",
    annualRentUsd: 3_000_00,
    createdAt: "2025-01-01T00:00:00Z",
    meta: {
      sizeSqm: 80,
      yearBuilt: 2020,
      propertyType: "apartment",
      rentalStatus: "rented",
      leaseUntil: "2027-01-01",
      activeTenant: true,
      tokenizationDocUrl: "https://example.com/doc",
    },
    rentalHistory: [],
    totalValueUsd: 200_000_00,
    sharesSold: 2500,
    sharesRemaining: 0,
    fundingProgressRatio: 1,
    monthlyYieldRate: 6,
    ...overrides,
  } as Listing;
}

describe("IncomeAnalytics — redesign Phase 7", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the income history chart with 12 monthly bars and a cumulative line", () => {
    const listing = makeListing();
    render(<IncomeAnalytics listing={listing} />);

    expect(screen.getByTestId("income-svg")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^income-bar-/)).toHaveLength(12);
    expect(screen.getByTestId("income-cumulative-line")).toBeInTheDocument();

    // Cumulative total must equal the sum of per-share payouts (display truth).
    const a = getPropertyAnalytics(listing);
    const sum = a.incomeHistory.reduce((s, p) => s + p.perShareUsd, 0);
    const shown = screen.getByTestId("income-cumulative-total");
    expect(shown.textContent).toContain(
      usd(a.incomeHistory.reduce((s, p2) => s + p2.perShareUsd, 0)),
    );
    expect(sum).toBeGreaterThan(0);
  });

  it("renders the payout history with one row per month, newest first", () => {
    const listing = makeListing();
    render(<IncomeAnalytics listing={listing} />);

    const history = screen.getByTestId("payout-history");
    const a = getPropertyAnalytics(listing);
    // Rows render newest-first (reversed shared history).
    const firstRow = within(history).getAllByTestId(/^payout-row-/)[0]!;
    const newestMonth = a.incomeHistory[a.incomeHistory.length - 1]!.month;
    expect(firstRow.getAttribute("data-testid")).toBe(`payout-row-${newestMonth}`);
    // One row per month, every month present.
    for (const m of a.incomeHistory.map((p) => p.month)) {
      expect(within(history).getByTestId(`payout-row-${m}`)).toBeInTheDocument();
    }
  });

  it("renders real-estate ratios from the shared metrics (gross yield + annual rate)", () => {
    const listing = makeListing({ annualRentUsd: 12_000_00, totalValueUsd: 200_000_00 });
    render(<IncomeAnalytics listing={listing} />);

    const ratios = screen.getByTestId("income-ratios");
    // 12,000 / 200,000 = 6.0% gross yield.
    expect(within(ratios).getByText("6.0%")).toBeInTheDocument();
  });

  it("shows the projections pointer to the Overview calculator", () => {
    render(<IncomeAnalytics listing={makeListing()} />);
    expect(screen.getByTestId("income-projections")).toBeInTheDocument();
    expect(screen.getByText("Use the income calculator on Overview.")).toBeInTheDocument();
  });

  it("tap a hit zone to see that month's payout detail in the tooltip", () => {
    render(<IncomeAnalytics listing={makeListing()} />);

    // Selection is driven by the invisible full-height hit zones (touch-first),
    // not by the bars themselves.
    fireEvent.pointerDown(screen.getByTestId("chart-hit-2"));
    const tooltip = screen.getByTestId("income-tooltip");
    expect(tooltip.textContent).not.toContain("Tap a bar");
    expect(tooltip.textContent).toContain("per share");
  });
});
