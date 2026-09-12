"use client";
// File responsibility: compose the Estate Detail layout — 4-tab architecture
// (Estate | Income | Ownership | Details) on the PROMPT 05 funnel:
// - Estate tab: desire (rental performance + V1 thesis + V1 fractionalization;
//   resale demoted to a collapsed block; canonical Reserve CTA closes).
// - Income tab: conviction (the V1 economic chain for THIS estate + honest
//   position income; Projected never presented as Paid/Accrued).
// - Ownership tab: decision (V1 $100/80k facts + position snapshot, Owner Stay
//   honest unavailable, yield/lock management; no simulated holder analytics).
// - Details tab: trust, about, documents, similar.
// The primary action (Buy sheet, MainButton) stays page-owned in route page.tsx.
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { DocumentMeta } from "@/types/property-document";
import type { EstateVerification } from "@/types/verification";
import type { EstateStayInfo } from "@/types/stay";
import { getCurrentSharePrice } from "@/lib/property-price";
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";
import { useEstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyHero } from "./PropertyHero";
import { PropertyMetricsGrid } from "./PropertyMetricsGrid";
import { PropertyTabs, type PropertyTabId } from "./PropertyTabs";
import { EstateTabPanel } from "./EstateTabPanel";
import { IncomeV1Story } from "./IncomeV1Story";
import { OwnershipV1Panel, V1_NOMINAL_SHARE_PRICE_CENTS } from "./OwnershipV1Panel";
import { PositionCard } from "./PositionCard";
import { OwnershipBanner } from "./OwnershipBanner";
import { YieldLockSection } from "./YieldLockSection";
import { OwnerStayCard } from "@/components/stay/OwnerStayCard";
import { PropertyTrust } from "./PropertyTrust";
import { PropertyAbout } from "./PropertyAbout";
import { SimilarProperties } from "./SimilarProperties";
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";

export function PropertyDetail({
  listing,
  orderBook,
  onBuy,
  ownedShares = 0,
  lockedShares = 0,
  avgCostUsd,
  documents = [],
  onDownloadDoc,
  downloadingDocId,
  documentsError,
  accruedUnpaidUsd = 0,
  verification,
  stay,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  onBuy: () => void;
  ownedShares?: number;
  /** Shares currently locked and earning (Phase 6). */
  lockedShares?: number;
  /** Holder's average cost, for lock principal preview. */
  avgCostUsd?: number;
  documents?: DocumentMeta[];
  onDownloadDoc?: (docId: string) => void;
  downloadingDocId?: string | null;
  /** Download failure surfaced in the documents block (never a silent error). */
  documentsError?: string | null;
  /** Accrued unpaid yield across this property's active locks (display only). */
  accruedUnpaidUsd?: number;
  /** Optional verification snapshot — renders only when genuinely verified. */
  verification?: EstateVerification;
  /** Slice 1 Owner Stay snapshot — honest unavailable until a real source exists. */
  stay?: EstateStayInfo;
}) {
  // REDESIGN-SPEC §4.4 — funding = Primary; funded/resale = Secondary.
  const isPrimary = listing.status === "funding";
  // Layer-1 gallery status pill vocabulary (same property.* namespace).
  const statusT = useTranslations("property");
  // Buyability drives fixed bottom chrome (MainButton owns the bottom when a
  // purchase is possible, otherwise tab bar + lifted sticky) — the Estate tab
  // tail follows it. Mirrors page.tsx canBuy (same fields, same rule).
  const canBuy = listing.sharesRemaining > 0;
  const [tab, setTab] = useState<PropertyTabId>("estate");
  /** Resale market block — collapsed by default; opened by "View Resale Opportunities". */
  const [resaleOpen, setResaleOpen] = useState(false);
  const scrollYBeforeTabRef = useRef<number | null>(null);

  // PROMPT 05 — canonical view-model via the hooks boundary (UI never touches
  // engines directly). Identity/valuation/share states flow from here; V1
  // projected economics arrive as estateVm.v1 (sole calculation authority).
  const { vm: estateVm } = useEstateDetailViewModel(listing, {
    asks: orderBook?.asks,
    sharesOwned: ownedShares,
    acquisitionPricePerShareUsd: avgCostUsd ?? null,
  });

  // Phase 8 (#06) — keep the viewport stable when swapping tab panels: panels have
  // very different heights, and the browser clamps the scroll offset mid-swap when
  // the new panel is shorter, which reads as a jump. Capture the offset on switch
  // and restore it after the new panel mounts, before paint. Clamped to the new
  // document height when the new panel is shorter than the saved offset.
  function handleTabChange(next: PropertyTabId) {
    if (next === tab) return;
    scrollYBeforeTabRef.current = window.scrollY;
    setTab(next);
  }

  useLayoutEffect(() => {
    const saved = scrollYBeforeTabRef.current;
    if (saved === null) return;
    scrollYBeforeTabRef.current = null;
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    window.scrollTo(0, Math.min(saved, max));
  });

  // Sold-out primary hero CTA → open the resale block on the Estate tab and bring it
  // into view (it is collapsed by default — "View Resale Opportunities").
  function handleViewResale() {
    setResaleOpen(true);
    setTab("estate");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Optional call: jsdom has no scrollIntoView; the state change still lands.
        document.getElementById("resale-block")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    });
  }

  // Single source of truth for "current share price" — computed ONCE here and fed to
  // every price display (lib/property-price). No section may re-derive it.
  const currentPriceUsd = getCurrentSharePrice(listing, { bestAskUsd: orderBook?.bestAskUsd });
  // V1 canonical fractionalization for the hero fraction (1/N of the estate).
  // Falls back to the listing supply only without a V1 input (never the 24).
  const v1ForHero = getFinancialModelV1(listing.id);
  const heroTotalShares = v1ForHero?.totalShares ?? listing.totalShares;
  // Resale block renders for secondary listings AND sold-out primary offerings.
  const hasResaleSurface = !isPrimary || listing.sharesRemaining <= 0;

  return (
    <div className="space-y-4" data-testid="property-detail">
      {/* ═══ Layer A — Estate header (gallery + hero) ═══ */}
      {/* PROMPT 03: canonical Estate24 identity drives user-visible name.
          Layer-1: the status pill lives on the photo (amber funded % / green
          Resale); the old standalone banner is gone. */}
      <PropertyGallery
        images={listing.images}
        title={estateVm.identity?.name ?? listing.title}
        statusPill={
          isPrimary
            ? {
                label: statusT("fundedCaptionShort", {
                  pct: Math.round(
                    (heroTotalShares > 0 ? listing.sharesSold / heroTotalShares : 0) * 100,
                  ),
                }),
                tone: "amber" as const,
              }
            : { label: statusT("bannerResale"), tone: "green" as const }
        }
      />
      <div className="px-0">
        <PropertyHero
          listing={listing}
          bestAskUsd={orderBook?.bestAskUsd}
          onBuy={onBuy}
          ownedShares={ownedShares}
          verification={verification}
          onManageOwnership={() => handleTabChange("ownership")}
          onViewResale={handleViewResale}
          market={estateVm.share.state.market}
          estateValueUsd={estateVm.valuation?.value ?? null}
          estateValueProvenance={estateVm.valuation?.provenance}
          estateValueDisplay={estateVm.valuationDisplay}
          canonicalName={estateVm.identity?.name}
          canonicalLocation={estateVm.identity?.location}
          totalSharesOverride={heroTotalShares}
        />
      </div>

      {/* KPI area — V1 projected monthly per share; canonical $8M value */}
      <PropertyMetricsGrid
        listing={listing}
        currentPriceUsd={currentPriceUsd}
        bestAskUsd={orderBook?.bestAskUsd ?? listing.bestAskUsd}
        v1={estateVm.v1}
        totalSharesOverride={heroTotalShares}
      />

      {/* Tabs — horizontal scroll, immediate switch */}
      <PropertyTabs active={tab} onChange={handleTabChange} />

      {/* ═══ Tab panels ═══ */}
      {tab === "estate" ? (
        <EstateTabPanel
          listing={listing}
          orderBook={orderBook}
          currentPriceUsd={currentPriceUsd}
          hasResaleSurface={hasResaleSurface}
          resaleOpen={resaleOpen}
          onResaleOpenChange={setResaleOpen}
          onBuy={onBuy}
          estateVm={estateVm}
          onShowIncome={() => handleTabChange("income")}
          canBuy={canBuy}
        />
      ) : null}

      {tab === "income" ? (
        <div
          role="tabpanel"
          id="panel-income"
          aria-labelledby="tab-income"
          className="space-y-5"
          data-testid="panel-income"
        >
          {/* PROMPT 05 conviction story — V1 chain + honest position income.
              Legacy simulated analytics + yield-rate calculator are retired
              from this tab (files kept, no longer the economic story). */}
          <IncomeV1Story
            v1={estateVm.v1}
            accruedUnpaidUsd={accruedUnpaidUsd}
            ownedShares={ownedShares}
            scalePosition={listing.sharePriceUsd === V1_NOMINAL_SHARE_PRICE_CENTS}
          />
        </div>
      ) : null}

      {tab === "ownership" ? (
        <div
          role="tabpanel"
          id="panel-ownership"
          aria-labelledby="tab-ownership"
          className="space-y-5"
          data-testid="panel-ownership"
        >
          {/* PROMPT 05 decision facts — V1 $100/total/position/consequences + Buy entry.
              Sell entries stay in the existing position flows below. */}
          <OwnershipV1Panel
            v1={estateVm.v1}
            ownedShares={ownedShares}
            sharesRemaining={listing.sharesRemaining}
            isPrimary={isPrimary}
            scalePosition={listing.sharePriceUsd === V1_NOMINAL_SHARE_PRICE_CENTS}
            onBuy={onBuy}
          />

          {/* Position snapshot — PositionCard (secondary) / OwnershipBanner (primary) */}
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

          {/* Owner Stay P0 preview — presentation only, honest unavailable state */}
          <OwnerStayCard listing={listing} ownedShares={ownedShares} stay={stay} />

          {/* Yield + lock/unlock management */}
          <YieldLockSection listing={listing} />
        </div>
      ) : null}

      {tab === "details" ? (
        <div
          role="tabpanel"
          id="panel-details"
          aria-labelledby="tab-details"
          className="space-y-5"
          data-testid="panel-details"
        >
          {/* Trust: verification states + management partner */}
          <PropertyTrust listing={listing} verification={verification} />

          {/* About + More details (PROMPT 04 Matrix Detail truth reference) */}
          <PropertyAbout
            listing={listing}
            aboutText={estateVm.aboutText}
            sizeText={estateVm.sizeText}
            displayName={estateVm.identity?.name}
            propertyType={estateVm.propertyType}
            descriptionFull={estateVm.descriptionFull}
            location={estateVm.identity?.location}
            nightlyDisplay={estateVm.nightlyDisplayText}
            valuationDisplay={estateVm.valuationDisplay}
            growthPotential={estateVm.growthPotential}
            listingId={estateVm.identity?.listingId}
          />

          {/* Documents */}
          {onDownloadDoc ? (
            <PropertyDocumentsList
              documents={documents}
              onDownload={onDownloadDoc}
              downloadingId={downloadingDocId}
              error={documentsError}
            />
          ) : null}

          {/* Similar Properties */}
          <SimilarProperties listing={listing} />
        </div>
      ) : null}
    </div>
  );
}
