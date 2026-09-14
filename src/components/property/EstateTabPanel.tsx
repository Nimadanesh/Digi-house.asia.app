// File responsibility: compose the Estate tab panel (PROMPT 05 desire) —
// property thesis first (rental performance + V1 high-level economics), then
// V1 fractionalization (valuation, growth, $100 shares), then the demoted
// resale market (collapsed) and the canonical Reserve CTA. No legacy Slice A
// economics (ADR/occupancy/17%/40-60), no funding dashboard, no simulated
// funding charts: Estate creates desire through clarity and truthful economic
// context; conviction lives on Income, decision on Ownership, truth on Detail.
"use client";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { EstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { ReserveVillaCta } from "./ReserveVillaCta";
import { RentalStoryBlock } from "./RentalStoryBlock";
import { ResaleBlock } from "./ResaleBlock";
import { EstateInvestmentPanel } from "./EstateInvestmentPanel";
import { EstateV1Thesis } from "./EstateV1Thesis";

export function EstateTabPanel({
  listing,
  orderBook,
  currentPriceUsd,
  hasResaleSurface,
  resaleOpen,
  onResaleOpenChange,
  onBuy,
  estateVm,
  onShowIncome,
  canBuy,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  currentPriceUsd: number;
  hasResaleSurface: boolean;
  resaleOpen: boolean;
  onResaleOpenChange: (open: boolean) => void;
  onBuy: () => void;
  estateVm: EstateDetailViewModel;
  onShowIncome: () => void;
  /**
   * Whether a primary purchase is currently possible. Fixed bottom chrome
   * follows it (MainButton owns the bottom when active, otherwise tab bar +
   * lifted sticky), so the tab's bottom clearance follows it too — otherwise
   * buyable pages carry ~100px of dead tail while others sit tight.
   */
  canBuy: boolean;
}) {
  return (
    <div
      role="tabpanel"
      id="panel-estate"
      aria-labelledby="tab-estate"
      className={canBuy ? "space-y-5 pb-4" : "space-y-5 pb-24"}
      data-testid="panel-estate"
    >
      {/* 1. Rental performance — observed nightly rate, pending derivatives */}
      <RentalStoryBlock
        nightlyDisplay={estateVm.nightlyDisplayText}
        onShowIncome={onShowIncome}
      />

      {/* 2. Investment thesis — V1 high-level economics (desire, not dashboard) */}
      <EstateV1Thesis v1={estateVm.v1} onShowIncome={onShowIncome} />

      {/* 3. Investment opportunity — V1 fractionalization + valuation + growth */}
      <EstateInvestmentPanel
        share={estateVm.share}
        estateValue={estateVm.valuation}
        estateValueDisplay={estateVm.valuationDisplay}
        growthPotential={estateVm.growthPotential}
        v1={estateVm.v1}
      />

      {/* 4. Secondary / sold-out: resale market as a collapsed block */}
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

      {/* Reserve Villa: official listing link closes the tab on every estate */}
      <ReserveVillaCta url={estateVm.rentalEscapesUrl} />
    </div>
  );
}
