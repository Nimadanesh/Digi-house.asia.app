// File responsibility: compose the Estate tab (Estate Page Structure §4 —
// desire): Why this estate → Key Specs → Amenities → Location (with the
// protected Reserve CTA closing the card). The collapsed resale block
// (protected secondary-market surface, hero "View Resale" entry target) is
// preserved for secondary/sold-out listings — for villa 1 it does not render.
// Thesis/investment panels moved to Income/Ownership per the locked structure.
"use client";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { EstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { getEstateEditorial } from "@/lib/economics/estates/estate-editorial";
import { getEstateHighlights } from "@/lib/economics/estates/estate-highlights";
import { getLocationDetailByPropertyId } from "@/lib/economics/estates/location-details-24";
import { ResaleBlock } from "@/components/property/ResaleBlock";
import { EstateWhySection } from "@/components/property/estate-tab/EstateWhySection";
import { EstateSpecsSection } from "@/components/property/estate-tab/EstateSpecsSection";
import { EstateAmenitiesSection } from "@/components/property/estate-tab/EstateAmenitiesSection";
import { EstateLocationSection } from "@/components/property/estate-tab/EstateLocationSection";

export function EstateTabPanel({
  listing,
  orderBook,
  currentPriceUsd,
  hasResaleSurface,
  resaleOpen,
  onResaleOpenChange,
  onBuy,
  estateVm,
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
  /**
   * Whether a primary purchase is currently possible. Fixed bottom chrome
   * follows it (MainButton owns the bottom when active, otherwise tab bar +
   * lifted sticky), so the tab's bottom clearance follows it too.
   */
  canBuy: boolean;
}) {
  const record = estateVm.estate24;
  const locationDetail = getLocationDetailByPropertyId(listing.id);
  const editorial = record != null ? getEstateEditorial(record.id) : null;
  const highlights = editorial
    ? editorial.highlights.map((label, i) => ({
        id: `hl-${i + 1}`,
        label,
        kind: "note" as const,
      }))
    : record != null
      ? getEstateHighlights(record, locationDetail)
      : [];

  return (
    <div
      role="tabpanel"
      id="panel-estate"
      aria-labelledby="tab-estate"
      className={canBuy ? "space-y-5 pb-4" : "space-y-5 pb-24"}
      data-testid="panel-estate"
    >
      <EstateWhySection
        descriptionShort={estateVm.descriptionShort}
        editorialHeadline={editorial?.headline ?? null}
        editorialBody={editorial?.body ?? null}
        highlights={highlights}
      />
      <EstateSpecsSection record={record} propertyType={estateVm.propertyType} />
      <EstateAmenitiesSection record={record} />
      <EstateLocationSection detail={locationDetail} reserveUrl={estateVm.rentalEscapesUrl} />

      {/* Protected: secondary/sold-out resale market surface (hero CTA target). */}
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
    </div>
  );
}
