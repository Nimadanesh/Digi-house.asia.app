"use client";
// File responsibility: compose the Earn tab (revision contract 2026-09-13):
// ONE strong prospective section — Your position ("If you invest today") —
// plus, for EXISTING owners, the preserved position surfaces (PositionCard on
// secondary / OwnershipBanner on primary) so the protected Lock/Sell flows
// stay reachable after the Yield section was removed from the Ownership tab.
// The income feel lives HERE and nowhere else on the page.
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { EstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { YourPositionSection } from "@/components/property/earn-tab/YourPositionSection";
import { PositionCard } from "@/components/property/PositionCard";
import { OwnershipBanner } from "@/components/property/OwnershipBanner";

export function EarnTabPanel({
  listing,
  estateVm,
  currentPriceUsd,
  orderBook,
  ownedShares = 0,
  lockedShares = 0,
  avgCostUsd,
  accruedUnpaidUsd = 0,
  onBuy,
}: {
  listing: Listing;
  estateVm: EstateDetailViewModel;
  currentPriceUsd: number;
  orderBook?: OrderBookState;
  ownedShares?: number;
  lockedShares?: number;
  avgCostUsd?: number;
  accruedUnpaidUsd?: number;
  /** Routes into the existing buy flow (Slice G/H untouched). */
  onBuy: () => void;
}) {
  const isPrimary = listing.status === "funding";
  return (
    <div
      role="tabpanel"
      id="panel-earn"
      aria-labelledby="tab-earn"
      className="space-y-5"
      data-testid="panel-earn"
    >
      <YourPositionSection v1={estateVm.v1} propertyId={listing.id} onBuy={onBuy} />

      {/* Preserved owner surfaces — Lock/Sell flows (protected) stay reachable. */}
      {!isPrimary ? (
        <PositionCard
          listing={listing}
          ownedShares={ownedShares}
          lockedShares={lockedShares}
          accruedUnpaidUsd={accruedUnpaidUsd}
          avgCostUsd={avgCostUsd}
          currentPriceUsd={currentPriceUsd}
          orderBook={orderBook}
        />
      ) : (
        <OwnershipBanner
          listing={listing}
          ownedShares={ownedShares}
          lockedShares={lockedShares}
          avgCostUsd={avgCostUsd}
        />
      )}
    </div>
  );
}
