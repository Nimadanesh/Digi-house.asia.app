"use client";
// File responsibility: compose the redesigned Property detail layout (REDESIGN-SPEC §3/§4).
// Phase 1 skeleton: Hero + Key Metrics + placeholders for later phases; primary action
// (Buy sheet, MainButton) stays page-owned.
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { DocumentMeta } from "@/types/property-document";
import { getCurrentSharePrice } from "@/lib/property-price";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyHero } from "./PropertyHero";
import { PropertyMetricsGrid } from "./PropertyMetricsGrid";
import { IncomeCalculator } from "./IncomeCalculator";
import { PerformanceChart } from "./PerformanceChart";
import { MarketSection } from "./MarketSection";
import { OwnershipBanner } from "./OwnershipBanner";
import { YieldLockSection } from "./YieldLockSection";
import { PropertyTrust } from "./PropertyTrust";
import { PropertyAbout } from "./PropertyAbout";
import { SimilarProperties } from "./SimilarProperties";
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";

export function PropertyDetail({
  listing,
  orderBook,
  onBuy,
  previewShares,
  onSharesChange,
  ownedShares = 0,
  lockedShares = 0,
  avgCostUsd,
  onBuyShares,
  documents = [],
  onDownloadDoc,
  downloadingDocId,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  onBuy: () => void;
  /** Calculator share count (page-owned so MainButton stays in sync). */
  previewShares: number;
  onSharesChange: (n: number) => void;
  ownedShares?: number;
  /** Shares currently locked and earning (Phase 6). */
  lockedShares?: number;
  /** Holder's average cost, for lock principal preview. */
  avgCostUsd?: number;
  onBuyShares: (n: number) => void;
  documents?: DocumentMeta[];
  onDownloadDoc?: (docId: string) => void;
  downloadingDocId?: string | null;
}) {
  // REDESIGN-SPEC §4.4 — funding = Primary; funded/resale = Secondary.
  const isPrimary = listing.status === "funding";

  // Single source of truth for "current share price" — computed ONCE here and fed to
  // every price display (lib/property-price). No section may re-derive it.
  const currentPriceUsd = getCurrentSharePrice(listing, { bestAskUsd: orderBook?.bestAskUsd });

  return (
    <div className="space-y-5 pb-6" data-testid="property-detail">
      {/* §3.1 Hero (gallery + banner + title + metric + CTA) */}
      <PropertyGallery images={listing.images} title={listing.title} />
      <div className="px-0">
        <PropertyHero
          listing={listing}
          bestAskUsd={orderBook?.bestAskUsd}
          onBuy={onBuy}
        />
      </div>

      {/* §3.2 Key Metrics */}
      <PropertyMetricsGrid listing={listing} currentPriceUsd={currentPriceUsd} />

      {/* Phase 6 — ownership banner (hidden while unknown / owns nothing) */}
      <OwnershipBanner
        listing={listing}
        ownedShares={ownedShares}
        lockedShares={lockedShares}
        avgCostUsd={avgCostUsd}
      />

      {/* §3.3 Investment Calculator — Phase 2 (upgraded) */}
      <IncomeCalculator
        listing={listing}
        shares={previewShares}
        onSharesChange={onSharesChange}
        ownedShares={ownedShares}
        lockedShares={lockedShares}
        onBuy={onBuyShares}
        currentPriceUsd={currentPriceUsd}
      />

      {/* Phase 6 — yield + lock/unlock flow */}
      <YieldLockSection listing={listing} />

      {/* §3.4 Performance Chart — Phase 3 */}
      <PerformanceChart listing={listing} anchorUsd={currentPriceUsd} />

      {/* §3.5 Market (Secondary only) — Phase 4 */}
      {!isPrimary ? <MarketSection listing={listing} orderBook={orderBook} /> : null}

      {/* §3.6 Trust & Social Proof — Phase 5 */}
      <PropertyTrust listing={listing} />

      {/* §3.7 About + More details — Phase 5 */}
      <PropertyAbout listing={listing} />

      {/* §3.8 Documents — Phase 5 */}
      {onDownloadDoc ? (
        <PropertyDocumentsList
          documents={documents}
          onDownload={onDownloadDoc}
          downloadingId={downloadingDocId}
        />
      ) : null}

      {/* §3.9 Similar Properties — Phase 5 */}
      <SimilarProperties listing={listing} />
    </div>
  );
}
