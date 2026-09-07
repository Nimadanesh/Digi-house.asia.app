// Tests for Slice E economics sections: engine outputs in, formatted economics out.
// No engine imports here beyond the view-model builders (the same path the page
// uses); money assertions use the exact canonical Grand 2 BDM figures so any
// formula fork in a component would fail loudly.

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { Listing } from "@/types/property";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  buildEstateDetailViewModel,
  selectScenarioEconomics,
  type ScenarioBound,
} from "@/lib/economics/estate-detail-view-model";
import { EstateEconomicsSection } from "@/components/property/EstateEconomicsSection";
import { EstateCostBreakdown } from "@/components/property/EstateCostBreakdown";
import { EstateProfitAllocation } from "@/components/property/EstateProfitAllocation";
import { EstateInvestmentPanel } from "@/components/property/EstateInvestmentPanel";

function makeListing(overrides: Partial<Listing> = {}): Listing {
  return {
    id: "prop-marina-vista-4b",
    title: "Grand 2 BDM Ocean Pool Villa",
    location: "JOALI Being, Maldives",
    description: "Waterfront one-bedroom.",
    images: ["/images/properties/joali-being-01.jpg"],
    totalShares: 2500,
    sharePriceUsd: 8000,
    status: "funding",
    ownerWalletAddress: "EQTest",
    annualRentUsd: 17256000,
    createdAt: "2026-07-10T09:00:00Z",
    sharesSold: 2300,
    sharesRemaining: 200,
    fundingProgressRatio: 0.92,
    monthlyYieldRate: 7.19,
    totalValueUsd: 82000000,
    nightlyRate: "$67,655",
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
    ...overrides,
  };
}

function grandSelected(bound: ScenarioBound = "base") {
  const vm = buildEstateDetailViewModel(makeListing());
  return { vm, selected: selectScenarioEconomics(vm, bound)! };
}

describe("Sections use the global provenance indicator (no visible labels)", () => {
  it("renders info triggers carrying provenance, explanations on demand", () => {
    const { vm, selected } = grandSelected();
    render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText="$67,655"
        selected={selected}
        envelopeRangeCents={null}
        bound="base"
        onBoundChange={() => {}}
      />,
    );
    const triggers = screen.getAllByTestId("provenance-info");
    expect(triggers.length).toBeGreaterThan(0);
    // No provenance wording visible before interaction…
    expect(screen.queryByText("Estimated value")).not.toBeInTheDocument();
    // …tap reveals the plain-language explanation.
    fireEvent.click(triggers[0]);
    expect(screen.getByTestId("provenance-sheet")).toBeVisible();
  });
});

describe("EstateEconomicsSection (Grand 2 BDM, base)", () => {
  it("shows the canonical nightly range, ADR, occupancy and gross with provenance", () => {
    const { vm, selected } = grandSelected();
    render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText="$67,655"
        selected={selected}
        envelopeRangeCents={{ lower: 1, upper: 2 }}
        bound="base"
        onBoundChange={() => {}}
      />,
    );
    expect(screen.getByTestId("economics-nightly")).toHaveTextContent("$67,000.00");
    expect(screen.getByTestId("economics-nightly")).toHaveTextContent("$80,000.00");
    expect(screen.getByTestId("economics-adr")).toHaveTextContent("$73,500.00");
    expect(screen.getByTestId("economics-occupancy")).toHaveTextContent("75%");
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("$20,120,625.00");
    expect(screen.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "true");
  });

  it("notifies bound changes without mutating engine state", () => {
    const { vm, selected } = grandSelected();
    const onBoundChange = vi.fn();
    render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText={null}
        selected={selected}
        envelopeRangeCents={null}
        bound="base"
        onBoundChange={onBoundChange}
      />,
    );
    fireEvent.click(screen.getByTestId("scenario-pill-lower"));
    expect(onBoundChange).toHaveBeenCalledWith("lower");
  });

  it("renders the lower bound gross when selected", () => {
    const { vm } = grandSelected();
    const selected = selectScenarioEconomics(vm, "lower")!;
    render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText={null}
        selected={selected}
        envelopeRangeCents={null}
        bound="lower"
        onBoundChange={() => {}}
      />,
    );
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("$16,096,500.00");
    expect(screen.getByTestId("economics-occupancy")).toHaveTextContent("60%");
  });
});

describe("EstateEconomicsSection (canonical record, no engine inputs)", () => {
  it("shows the observed nightly display plus pending rows that name the missing input", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "prop-soho-loft-studio" }),
    );
    render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText={vm.nightlyDisplayText}
        selected={null}
        envelopeRangeCents={null}
        bound="base"
        onBoundChange={() => {}}
      />,
    );
    // Observed listing fact stays visible with provenance…
    expect(screen.getByTestId("economics-nightly")).toHaveTextContent("$52,200–$75,800+");
    // …derived rows stay pending (never zero, never fabricated)…
    expect(screen.getByTestId("economics-adr")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("economics-occupancy")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("Data pending");
    // …and the section explains what is missing instead of an empty shell.
    expect(screen.getByTestId("economics-pending-note")).toHaveTextContent(
      "Occupancy hasn't been reported",
    );
    expect(screen.queryByTestId("economics-unavailable")).not.toBeInTheDocument();
  });

  it("always renders the three scenario tabs, even without engine inputs", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "prop-soho-loft-studio" }),
    );
    render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText={vm.nightlyDisplayText}
        selected={null}
        envelopeRangeCents={null}
        bound="base"
        onBoundChange={() => {}}
      />,
    );
    expect(screen.getByTestId("scenario-pills")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-pill-lower")).toBeInTheDocument();
    expect(screen.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("scenario-pill-upper")).toHaveAttribute("aria-pressed", "false");
  });

  it("tabs stay selectable without engine inputs (pressed follows bound, rows stay pending)", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "prop-soho-loft-studio" }),
    );
    const onBoundChange = vi.fn();
    const { rerender } = render(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText={vm.nightlyDisplayText}
        selected={null}
        envelopeRangeCents={null}
        bound="base"
        onBoundChange={onBoundChange}
      />,
    );
    fireEvent.click(screen.getByTestId("scenario-pill-lower"));
    expect(onBoundChange).toHaveBeenCalledWith("lower");
    rerender(
      <EstateEconomicsSection
        nightlyRangeCents={vm.nightlyRangeCents}
        nightlyFallbackText={vm.nightlyDisplayText}
        selected={null}
        envelopeRangeCents={null}
        bound="lower"
        onBoundChange={onBoundChange}
      />,
    );
    expect(screen.getByTestId("scenario-pill-lower")).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("scenario-pill-base")).toHaveAttribute("aria-pressed", "false");
    // Switching tabs fabricates nothing: rows stay pending, never zero.
    expect(screen.getByTestId("economics-gross")).toHaveTextContent("Data pending");
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });

  it("all 24 canonical estates render exactly three tabs with property-specific data", () => {
    for (const p of PROPERTIES) {
      const vm = buildEstateDetailViewModel(p);
      const { unmount } = render(
        <EstateEconomicsSection
          nightlyRangeCents={vm.nightlyRangeCents}
          nightlyFallbackText={vm.nightlyDisplayText}
          selected={vm.baseline ? selectScenarioEconomics(vm, "base") : null}
          envelopeRangeCents={null}
          bound="base"
          onBoundChange={() => {}}
        />,
      );
      const pills = screen.getAllByTestId(/^scenario-pill-/);
      expect(pills, `${p.id} three tabs`).toHaveLength(3);
      // Canonical nightly identity is property-specific: numeric range where
      // configured (Grand), verbatim display text otherwise (semantics intact).
      if (vm.nightlyRangeCents != null) {
        expect(screen.getByTestId("economics-nightly").textContent, `${p.id} nightly`).toContain(
          "$67,000.00",
        );
      } else {
        expect(screen.getByTestId("economics-nightly").textContent, `${p.id} nightly`).toContain(
          vm.nightlyDisplayText!,
        );
      }
      if (vm.baseline == null) {
        expect(screen.getByTestId("economics-pending-note")).toBeInTheDocument();
      }
      unmount();
    }
    expect(PROPERTIES).toHaveLength(24);
  });
});

describe("EstateCostBreakdown", () => {
  it("summarizes pending totals, then reveals all six lines with the green tax pending", () => {
    const { vm, selected } = grandSelected();
    render(<EstateCostBreakdown economics={selected.result.economics} />);
    // Green tax unknown → the total is not a fact.
    expect(screen.getByTestId("costs-total")).toHaveTextContent("Data pending");
    expect(screen.queryByTestId("costs-content")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("costs-toggle"));
    for (const id of [
      "tourismTax",
      "serviceCharge",
      "greenTax",
      "agencyRentalOta",
      "operatorOperating",
      "repairInsuranceMaintenance",
    ]) {
      expect(screen.getByTestId(`cost-line-${id}`)).toBeInTheDocument();
    }
    expect(screen.getByTestId("cost-line-tourismTax")).toHaveTextContent("$3,420,506.25");
    // Contract rates render exactly (12.5%, never the rounded "13%").
    expect(screen.getByText("12.5% of gross revenue")).toBeInTheDocument();
    expect(screen.getByText("17% of gross revenue")).toBeInTheDocument();
    expect(screen.getByTestId("cost-line-greenTax")).toHaveTextContent("Data pending");
    void vm;
  });

  it("renders unavailable treatment without economics", () => {
    render(<EstateCostBreakdown economics={null} />);
    expect(screen.getByTestId("costs-unavailable")).toBeInTheDocument();
  });

  it("renders pending lines from the shared rate table (same structure, no facts)", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "prop-soho-loft-studio" }),
    );
    render(<EstateCostBreakdown economics={null} pendingLines={vm.pendingCosts} />);
    expect(screen.queryByTestId("costs-unavailable")).not.toBeInTheDocument();
    // Total is not a fact while any line is unknown.
    expect(screen.getByTestId("costs-total")).toHaveTextContent("Data pending");
    fireEvent.click(screen.getByTestId("costs-toggle"));
    for (const id of [
      "tourismTax",
      "serviceCharge",
      "greenTax",
      "agencyRentalOta",
      "operatorOperating",
      "repairInsuranceMaintenance",
    ]) {
      expect(screen.getByTestId(`cost-line-${id}`)).toHaveTextContent("Data pending");
    }
    // Rate structure stays visible (model facts, not results).
    expect(screen.getByText("17% of gross revenue")).toBeInTheDocument();
    expect(screen.getByText("12.5% of gross revenue")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });
});

describe("EstateProfitAllocation", () => {
  it("labels every basis; owner/operator pending while agency share is calculated", () => {
    const { selected } = grandSelected();
    render(<EstateProfitAllocation economics={selected.result.economics} />);
    expect(screen.getByTestId("allocation-owner")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("allocation-operator")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("allocation-agency")).toHaveTextContent("$3,621,712.50");
  });

  it("renders pending rows without economics (rate bases visible, no facts)", () => {
    render(<EstateProfitAllocation economics={null} />);
    expect(screen.queryByTestId("allocation-unavailable")).not.toBeInTheDocument();
    expect(screen.getByTestId("allocation-owner")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("allocation-operator")).toHaveTextContent("Data pending");
    expect(screen.getByTestId("allocation-agency")).toHaveTextContent("Data pending");
    // Allocation bases stay labeled (model facts, not results).
    expect(screen.getByText("40% of net profit")).toBeInTheDocument();
    expect(screen.getByText("60% of net profit")).toBeInTheDocument();
    expect(screen.getByText("18% of gross revenue")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).not.toBeInTheDocument();
  });
});

describe("EstateInvestmentPanel", () => {
  it("shows the canonical estate value once (no legacy revival, no duplication)", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    render(
      <EstateInvestmentPanel
        share={vm.share}
        estateValue={{ value: 800_000_000, provenance: "estimated" }}
      />,
    );
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent("$8,000,000.00");
    expect(
      screen.getByTestId("investment-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
  });

  it("renders the estate value as pending without a canonical record", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "prop-unknown-fixture" }));
    render(<EstateInvestmentPanel share={vm.share} estateValue={vm.valuation} />);
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent("Data pending");
  });

  it("funding: primary price, availability, per-share ownership, plans note", () => {
    const vm = buildEstateDetailViewModel(makeListing());
    render(<EstateInvestmentPanel share={vm.share} />);
    expect(screen.getByTestId("investment-total-shares")).toHaveTextContent("2,500");
    expect(screen.getByTestId("investment-primary-price")).toHaveTextContent("$80.00");
    expect(screen.getByTestId("investment-available")).toHaveTextContent("200");
    expect(screen.getByTestId("investment-ownership-per-share")).toHaveTextContent("1 / 2,500");
    // Grand $8M reference: 800,000,000 / 2500 = $3,200.00 per share.
    expect(screen.getByTestId("investment-reference-value")).toHaveTextContent("$3,200.00");
    expect(screen.getByTestId("investment-plans-note")).toBeInTheDocument();
  });

  it("resale with multiple asks: primary closed, no single price, lowest ask quoted", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ status: "resale", sharesRemaining: 0 }),
      { asks: [{ priceUsd: 13200, quantity: 18, cumulative: 18 }, { priceUsd: 12900, quantity: 5, cumulative: 23 }] },
    );
    render(<EstateInvestmentPanel share={vm.share} />);
    expect(screen.getByTestId("investment-primary-price")).toHaveTextContent(
      "Primary offering closed",
    );
    expect(screen.getByTestId("investment-secondary-price")).toHaveTextContent(
      "No single market price",
    );
    expect(screen.getByTestId("investment-lowest-ask")).toHaveTextContent("$129.00");
  });

  it("approved valuation flows to non-Grand reference values (never legacy)", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "prop-soho-loft-studio", totalShares: 1000 }),
    );
    render(<EstateInvestmentPanel share={vm.share} estateValue={vm.valuation} />);
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent("$20,000,000.00");
    expect(
      screen.getByTestId("investment-estate-value").querySelector('[aria-label="Estimated value"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId("investment-reference-value")).toHaveTextContent("$20,000.00");
  });

  it("PROMPT 03: Grand shows the $8M–$10M range with $18M growth potential (no percentage)", () => {
    const vm = buildEstateDetailViewModel(makeListing({ id: "prop-marina-vista-4b" }));
    render(
      <EstateInvestmentPanel
        share={vm.share}
        estateValue={vm.valuation}
        estateValueDisplay={vm.valuationDisplay}
        growthPotential={vm.growthPotential}
      />,
    );
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent(
      "$8,000,000.00–$10,000,000.00",
    );
    expect(screen.getByTestId("estate-investment")).toHaveTextContent(
      "Estimated Growth Potential",
    );
    expect(screen.getByTestId("investment-growth-potential")).toHaveTextContent("$18,000,000.00");
    expect(screen.getByTestId("investment-growth-potential").textContent).not.toContain("%");
  });

  it("PROMPT 03: single-value estates show growth potential with an explicit percentage", () => {
    const vm = buildEstateDetailViewModel(
      makeListing({ id: "prop-soho-loft-studio", totalShares: 1000 }),
    );
    render(
      <EstateInvestmentPanel
        share={vm.share}
        estateValue={vm.valuation}
        estateValueDisplay={vm.valuationDisplay}
        growthPotential={vm.growthPotential}
      />,
    );
    expect(screen.getByTestId("investment-estate-value")).toHaveTextContent("$20,000,000.00");
    expect(screen.getByTestId("estate-investment")).toHaveTextContent(
      "Estimated Growth Potential",
    );
    expect(screen.getByTestId("investment-growth-potential")).toHaveTextContent("$26,400,000.00");
    expect(screen.getByTestId("investment-growth-potential")).toHaveTextContent("+32%");
  });
});
