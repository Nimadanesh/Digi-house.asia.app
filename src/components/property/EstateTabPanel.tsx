// File responsibility: compose the Estate tab panel — offering state, then the
// six canonical sections in product order (rental performance → rental
// economics → cost structure → profit allocation → investment opportunity →
// market/resale), then performance visuals. Layout only; economics arrive via
// props from the view-model hook, trading actions via callbacks. Every estate
// renders the same sections — pending inputs render as pending, never as empty
// shells and never as invented values.
"use client";
import dynamic from "next/dynamic";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type {
  SelectedScenario,
  ScenarioBound,
  EstateDetailViewModel,
} from "@/hooks/useEstateDetailViewModel";
import { TabPanelSkeleton } from "@/components/common/Skeleton";
import { ReserveVillaCta } from "./ReserveVillaCta";
import { FundingPanel } from "./FundingPanel";
import { RentalStoryBlock } from "./RentalStoryBlock";
import { ResaleBlock } from "./ResaleBlock";
import { EstateEconomicsSection } from "./EstateEconomicsSection";
import { EstateCostBreakdown } from "./EstateCostBreakdown";
import { EstateProfitAllocation } from "./EstateProfitAllocation";
import { EstateInvestmentPanel } from "./EstateInvestmentPanel";

// Phase 8 performance: funding charts stay code-split — the Estate tab ships
// without their chart JS until this panel mounts them (moved here with the tab).
const PrimaryPerformanceCharts = dynamic(
  () => import("./PrimaryPerformanceCharts").then((m) => m.PrimaryPerformanceCharts),
  {
    loading: () => <TabPanelSkeleton />,
    ssr: false,
  },
);

export function EstateTabPanel({
  listing,
  orderBook,
  currentPriceUsd,
  isPrimary,
  hasResaleSurface,
  resaleOpen,
  onResaleOpenChange,
  onBuy,
  estateVm,
  selectedScenario,
  scenarioBound,
  onBoundChange,
  onShowIncome,
  canBuy,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  currentPriceUsd: number;
  isPrimary: boolean;
  hasResaleSurface: boolean;
  resaleOpen: boolean;
  onResaleOpenChange: (open: boolean) => void;
  onBuy: () => void;
  estateVm: EstateDetailViewModel;
  selectedScenario: SelectedScenario | null;
  scenarioBound: ScenarioBound;
  onBoundChange: (bound: ScenarioBound) => void;
  onShowIncome: () => void;
  /**
   * Whether a primary purchase is currently possible. Fixed bottom chrome
   * follows it (MainButton owns the bottom when active, otherwise tab bar +
   * lifted sticky), so the tab's bottom clearance follows it too — otherwise
   * buyable pages carry ~100px of dead tail while others sit tight.
   */
  canBuy: boolean;
}) {
  const envelopeRangeCents = estateVm.envelope
    ? {
      lower: estateVm.envelope.lower.economics.revenue.grossAnnualRevenueUsd,
      upper: estateVm.envelope.upper.economics.revenue.grossAnnualRevenueUsd,
    }
    : null;
  const engineEconomics = selectedScenario?.result.economics ?? null;
  return (
    <div
      role="tabpanel"
      id="panel-estate"
      aria-labelledby="tab-estate"
      className={canBuy ? "space-y-5 pb-4" : "space-y-5 pb-24"}
      data-testid="panel-estate"
    >
      {/* Primary: funding story leads (calm, no urgency) */}
      {isPrimary ? <FundingPanel listing={listing} /> : null}

      {/* 1. Rental performance — observed nightly rate, pending derivatives */}
      <RentalStoryBlock
        nightlyDisplay={estateVm.nightlyDisplayText}
        onShowIncome={onShowIncome}
      />

      {/* 2–4. Rental economics, cost structure, profit allocation — engine
          values where inputs exist, honest pending states otherwise. */}
      <EstateEconomicsSection
        nightlyRangeCents={estateVm.nightlyRangeCents}
        nightlyFallbackText={estateVm.nightlyDisplayText ?? listing.nightlyRate ?? null}
        selected={selectedScenario}
        envelopeRangeCents={envelopeRangeCents}
        bound={scenarioBound}
        onBoundChange={onBoundChange}
      />
      <EstateCostBreakdown economics={engineEconomics} pendingLines={estateVm.pendingCosts} />
      <EstateProfitAllocation economics={engineEconomics} />

      {/* 5. Investment opportunity (listing facts + approved valuation) */}
      <EstateInvestmentPanel
        share={estateVm.share}
        estateValue={estateVm.valuation}
        estateValueDisplay={estateVm.valuationDisplay}
        growthPotential={estateVm.growthPotential}
      />

      {/* 6. Secondary / sold-out: resale market as a collapsed block */}
      {hasResaleSurface ? (
        <ResaleBlock
          listing={listing}
          orderBook={orderBook}
          anchorUsd={currentPriceUsd}
          onBuy={onBuy}
          open={resaleOpen}
          onOpenChange={onResaleOpenChange}
        />
      ) : null}

      {/* Primary: funding progress charts (shared simulated dataset, disclosed) */}
      {isPrimary ? <PrimaryPerformanceCharts listing={listing} /> : null}

      {/* Reserve Villa: official listing link closes the tab on every estate */}
      <ReserveVillaCta url={estateVm.rentalEscapesUrl} />
    </div>
  );
}
