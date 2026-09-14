"use client";
// File responsibility: compose the Ownership tab (Estate Page Structure §6 —
// decision): Valuation & Shares → Growth Potential → Exit & Liquidity → Risk
// Disclosures → Owner Stay. Revision contract 2026-09-13: the position
// preview moved to the new Earn tab, and the Yield section (rate / your
// shares / free-to-lock + its lock/sell triggers) was REMOVED entirely — the
// owner Lock/Sell surfaces (PositionCard / OwnershipBanner) live on the Earn
// tab now. No secondary-market roadmap claims (D9 removed from this wave).
import type { Listing } from "@/types/property";
import type { EstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { ValuationSharesSection } from "@/components/property/ownership-tab/ValuationSharesSection";
import { GrowthPotentialSection } from "@/components/property/ownership-tab/GrowthPotentialSection";
import { ExitLiquiditySection } from "@/components/property/ownership-tab/ExitLiquiditySection";
import { RiskDisclosuresSection } from "@/components/property/ownership-tab/RiskDisclosuresSection";
import { OwnerStayCard } from "@/components/stay/OwnerStayCard";
import type { EstateStayInfo } from "@/types/stay";

export function OwnershipTabPanel({
  listing,
  estateVm,
  ownedShares = 0,
  stay,
}: {
  listing: Listing;
  estateVm: EstateDetailViewModel;
  /** Needed by the Owner Stay privilege display (owner vs non-owner states). */
  ownedShares?: number;
  stay?: EstateStayInfo;
}) {
  return (
    <div
      role="tabpanel"
      id="panel-ownership"
      aria-labelledby="tab-ownership"
      className="space-y-5"
      data-testid="panel-ownership"
    >
      <ValuationSharesSection v1={estateVm.v1} />
      <GrowthPotentialSection growthPotential={estateVm.growthPotential} />
      <ExitLiquiditySection />
      <RiskDisclosuresSection />
      <OwnerStayCard listing={listing} ownedShares={ownedShares} stay={stay} />
    </div>
  );
}
