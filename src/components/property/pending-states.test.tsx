// Phase 9 Slice 3 — every pending state villa by villa (RED-first).
//
// For all 24 canonical villas: a pending monthly figure must always carry its
// human-readable reason (never a bare unexplained state), and computable villas
// must never show pending. Layout/CTA assertions live in the E2E + QA probe;
// this file pins the per-villa pending matrix at component level.
import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { toCanonicalListing } from "@/lib/mock/canonical-listing";
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";
import {
  getPresentedMonthlyIncome,
  presentedIncomeUnknownCaption,
} from "@/lib/economics/property-presentation";
import { PropertyMetricsGrid } from "@/components/property/PropertyMetricsGrid";
import { IncomeCalculator } from "@/components/property/IncomeCalculator";
import { vi } from "vitest";

const listings = PROPERTIES.map(toCanonicalListing);
const isUnknown = (id: string) =>
  getPresentedMonthlyIncome(id).cents == null;

function renderMetrics(id: string) {
  const listing = listings.find((l) => l.id === id)!;
  render(
    <PropertyMetricsGrid
      listing={listing}
      currentPriceUsd={listing.sharePriceUsd}
      v1={getFinancialModelV1(id) ?? null}
    />,
  );
}

function renderCalc(id: string) {
  const listing = listings.find((l) => l.id === id)!;
  render(
    <IncomeCalculator
      listing={listing}
      shares={10}
      onSharesChange={() => {}}
      onBuy={vi.fn()}
    />,
  );
}

describe("Slice 3 — metrics grid pending states for all 24 villas", () => {
  it("unknown villas show a bare honest pending (DEC-013: the reason moved off the KPI grid — it lives on the Income tab); known villas show values", () => {
    for (const l of listings) {
      cleanup();
      renderMetrics(l.id);
      if (isUnknown(l.id)) {
        expect(screen.getByTestId("metrics-grid").textContent, l.id).toMatch(
          /Data pending/,
        );
        // DEC-013: no reason caption on the KPI grid (dedup) — the figure is
        // the honest pending word; the explanation stays on the Income tab.
        expect(screen.queryByTestId("metrics-income-reason"), l.id).not.toBeInTheDocument();
      } else {
        expect(screen.getByTestId("metrics-grid").textContent, l.id).not.toMatch(
          /Data pending/,
        );
      }
    }
  });
});

describe("Slice 3 — income calculator pending states for all 24 villas", () => {
  it("unknown villas show pending WITH the human-readable reason; known villas show values", () => {
    for (const l of listings) {
      cleanup();
      renderCalc(l.id);
      const reason = presentedIncomeUnknownCaption(
        getPresentedMonthlyIncome(l.id).unknownKind,
      );
      if (isUnknown(l.id)) {
        expect(screen.getByTestId("calc-pending").textContent, l.id).toMatch(
          /Data pending/,
        );
        expect(screen.getByTestId("calc-pending").textContent, l.id).toContain(reason!);
        expect(screen.queryByTestId("calc-monthly"), l.id).not.toBeInTheDocument();
      } else {
        expect(screen.queryByTestId("calc-pending"), l.id).not.toBeInTheDocument();
        expect(screen.getByTestId("calc-monthly"), l.id).toBeInTheDocument();
      }
    }
  });
});
