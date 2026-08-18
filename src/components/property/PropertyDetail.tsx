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
import { YieldLockSection } from "./YieldLockSection";
import { PropertyAbout } from "./PropertyAbout";
import { PropertyTrust } from "./PropertyTrust";
import { RentalHistory } from "./RentalHistory";
import { TradeSection } from "./TradeSection";
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";
import type { DocumentMeta } from "@/types/property-document";

export function PropertyDetail({
  listing,
  orderBook,
  previewShares,
  onPreviewSharesChange,
  documents = [],
  onDownloadDoc,
  downloadingDocId,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  previewShares: number;
  onPreviewSharesChange: (n: number) => void;
  documents?: DocumentMeta[];
  onDownloadDoc?: (docId: string) => void;
  downloadingDocId?: string | null;
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
      {/* PRODUCT-PLAN §0.1/§0.3 — secondary market (resale/funded only) */}
      {listing.status === "resale" || listing.status === "funded" ? (
        <TradeSection listing={listing} orderBook={orderBook} />
      ) : null}
      {/* Fable §Income calculator */}
      <IncomeCalculator
        listing={listing}
        shares={previewShares}
        onSharesChange={onPreviewSharesChange}
      />
      {/* PRODUCT-PLAN §0.4 — yield + share locking */}
      <YieldLockSection listing={listing} />
      {/* Fable §About */}
      <PropertyAbout listing={listing} />
      {/* Fable §Trust */}
      <PropertyTrust listing={listing} />
      {/* Fable §Rental history */}
      <RentalHistory listing={listing} />
      {/* P4-04: Documents */}
      {onDownloadDoc ? (
        <PropertyDocumentsList
          documents={documents}
          onDownload={onDownloadDoc}
          downloadingId={downloadingDocId}
        />
      ) : null}
    </div>
  );
}
