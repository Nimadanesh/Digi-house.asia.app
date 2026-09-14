"use client";
// File responsibility: compose the Details tab (Estate Page Structure §7 +
// revision contract): Management & Operator (D1), Legal & Structure (D2–D4 as
// three expandable rows), Documents (locked D5 list, first 5 + show-all,
// honest pending until real PDFs exist), Distribution & Tax (monthly accrual
// + the D11 disclosure as a collapsed row), and Historical Performance (D8
// honest disclosure). Truth-only tab: the pending-only trust block is removed
// this wave (revision contract §15) — only genuinely green trust items would
// render, and none exist yet. No projections, no simulated performance.
import type { Listing } from "@/types/property";
import type { EstateVerification } from "@/types/verification";
import type { EstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { OperatorSection } from "@/components/property/details-tab/OperatorSection";
import { LegalStructureSection } from "@/components/property/details-tab/LegalStructureSection";
import { EstateDocumentsPendingSection } from "@/components/property/details-tab/EstateDocumentsPendingSection";
import { DistributionTaxSection } from "@/components/property/details-tab/DistributionTaxSection";
import { HistoricalPerformanceSection } from "@/components/property/details-tab/HistoricalPerformanceSection";

export function DetailsTabPanel({
  listing,
  estateVm,
  verification,
}: {
  listing: Listing;
  estateVm: EstateDetailViewModel;
  /** Kept for the page contract; nothing green to render yet (§15). */
  verification?: EstateVerification;
}) {
  void verification;
  return (
    <div
      role="tabpanel"
      id="panel-details"
      aria-labelledby="tab-details"
      className="space-y-5"
      data-testid="panel-details"
    >
      <OperatorSection propertyId={listing.id} />
      <LegalStructureSection propertyId={listing.id} />
      <EstateDocumentsPendingSection villaName={estateVm.identity?.name ?? null} />
      <DistributionTaxSection propertyId={listing.id} />
      <HistoricalPerformanceSection />
    </div>
  );
}
