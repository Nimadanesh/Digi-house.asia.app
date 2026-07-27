"use client";
// File responsibility: compose Property detail layout (Fable full structure). Read-only sections;
// buy primary action lives on MainButton → BuySheet (page-owned).
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyHero } from "./PropertyHero";
import { SalesProgress } from "./SalesProgress";
import { PropertyMetricsGrid } from "./PropertyMetricsGrid";
import { IncomeCalculator } from "./IncomeCalculator";
import { PropertyAbout } from "./PropertyAbout";
import { PropertyTrust } from "./PropertyTrust";
import { RentalHistory } from "./RentalHistory";
import { OrderBook } from "./OrderBook";

export function PropertyDetail({
  listing,
  orderBook,
  previewShares,
  onPreviewSharesChange,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  previewShares: number;
  onPreviewSharesChange: (n: number) => void;
}) {
  return (
    <div className="space-y-4 pb-6" data-testid="property-detail">
      {/* Fable §Gallery */}
      <PropertyGallery images={listing.images} title={listing.title} />
      {/* Fable §Hero */}
      <PropertyHero listing={listing} />
      {/* Fable §Sales progress */}
      <SalesProgress listing={listing} />
      {/* Fable §Metrics */}
      <PropertyMetricsGrid listing={listing} />
      {/* Fable §Income calculator */}
      <IncomeCalculator
        listing={listing}
        shares={previewShares}
        onSharesChange={onPreviewSharesChange}
      />
      {/* Fable §About */}
      <PropertyAbout listing={listing} />
      {/* Fable §Trust */}
      <PropertyTrust listing={listing} />
      {/* Fable §Rental history */}
      <RentalHistory listing={listing} />
      {orderBook ? <OrderBook state={orderBook} /> : null}
    </div>
  );
}
