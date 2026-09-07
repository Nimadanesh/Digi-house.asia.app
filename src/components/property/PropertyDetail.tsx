"use client";
// File responsibility: compose the Estate Detail layout — Phase 9 Slice 2
// (PHASE-9-IMPLEMENTATION-CONTRACT Slice 2; UI Mapping §5): header (gallery + hero)
// + KPI grid, then a 4-tab architecture (Estate | Income | Ownership | Details).
//
// Phase 9 branching rules (UI Mapping §5.2):
// - Estate tab: funding story leads (Primary); resale market DEMOTED to a collapsed
//   block (Secondary/sold-out); rental-economics narrative; property fundamentals.
// - Income tab: income history (simulated, disclosed) + the projections calculator.
// - Ownership tab: position snapshot (banner/card), Owner Stay P0 preview (honest
//   unavailable), yield/lock management, holder analytics.
// - Details tab: trust (verification states + management), about, documents, similar.
// The primary action (Buy sheet, MainButton) stays page-owned in route page.tsx.
import { useLayoutEffect, useRef, useState } from "react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { DocumentMeta } from "@/types/property-document";
import type { EstateVerification } from "@/types/verification";
import type { EstateStayInfo } from "@/types/stay";
import { getCurrentSharePrice } from "@/lib/property-price";
import { useEstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import dynamic from "next/dynamic";
import { TabPanelSkeleton } from "@/components/common/Skeleton";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyHero } from "./PropertyHero";
import { PropertyMetricsGrid } from "./PropertyMetricsGrid";
import { PropertyTabs, type PropertyTabId } from "./PropertyTabs";
import { EstateTabPanel } from "./EstateTabPanel";
import { IncomeCalculator } from "./IncomeCalculator";
import { PositionCard } from "./PositionCard";
import { OwnershipBanner } from "./OwnershipBanner";
import { YieldLockSection } from "./YieldLockSection";
import { OwnerStayCard } from "@/components/stay/OwnerStayCard";
import { PropertyTrust } from "./PropertyTrust";
import { PropertyAbout } from "./PropertyAbout";
import { SimilarProperties } from "./SimilarProperties";
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";

// Phase 8 performance: the heavy analytics tab panels (Phase 5–7 chart suites)
// are code-split and loaded on demand — the Estate tab (default) ships without
// their chart JS. Panels render a skeleton fallback while the chunk loads.
const HolderAnalytics = dynamic(
  () => import("./HolderAnalytics").then((m) => m.HolderAnalytics),
  {
    loading: () => <TabPanelSkeleton />,
    ssr: false,
  },
);
const IncomeAnalytics = dynamic(
  () => import("./IncomeAnalytics").then((m) => m.IncomeAnalytics),
  {
    loading: () => <TabPanelSkeleton />,
    ssr: false,
  },
);

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
  documentsError,
  accruedUnpaidUsd = 0,
  verification,
  stay,
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
  // Buyability drives fixed bottom chrome (MainButton owns the bottom when a
  // purchase is possible, otherwise tab bar + lifted sticky) — the Estate tab
  // tail follows it. Mirrors page.tsx canBuy (same fields, same rule).
  const canBuy = listing.sharesRemaining > 0;
  const [tab, setTab] = useState<PropertyTabId>("estate");
  /** Resale market block — collapsed by default; opened by "View Resale Opportunities". */
  const [resaleOpen, setResaleOpen] = useState(false);
  const scrollYBeforeTabRef = useRef<number | null>(null);

  // Slice E — canonical view-model via the hooks boundary (UI never touches
  // engines directly). Economics/scenario/share/CTA states flow from here.
  const {
    vm: estateVm,
    bound: scenarioBound,
    onBoundChange: handleBoundChange,
    selected: selectedScenario,
  } = useEstateDetailViewModel(listing, {
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
  // Resale block renders for secondary listings AND sold-out primary offerings.
  const hasResaleSurface = !isPrimary || listing.sharesRemaining <= 0;

  return (
    <div className="space-y-4" data-testid="property-detail">
      {/* ═══ Layer A — Estate header (gallery + hero) ═══ */}
      {/* PROMPT 03: canonical Estate24 identity drives user-visible name. */}
      <PropertyGallery images={listing.images} title={estateVm.identity?.name ?? listing.title} />
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
          canonicalName={estateVm.identity?.name}
          canonicalLocation={estateVm.identity?.location}
        />
      </div>

      {/* KPI area — ownership-first labels, available data only */}
      <PropertyMetricsGrid
        listing={listing}
        currentPriceUsd={currentPriceUsd}
        totalValueUsdOverride={estateVm.valuation?.value ?? null}
        totalValueDisplay={estateVm.valuationDisplay}
      />

      {/* Tabs — horizontal scroll, immediate switch */}
      <PropertyTabs active={tab} onChange={handleTabChange} />

      {/* ═══ Tab panels ═══ */}
      {tab === "estate" ? (
        <EstateTabPanel
          listing={listing}
          orderBook={orderBook}
          currentPriceUsd={currentPriceUsd}
          isPrimary={isPrimary}
          hasResaleSurface={hasResaleSurface}
          resaleOpen={resaleOpen}
          onResaleOpenChange={setResaleOpen}
          onBuy={onBuy}
          estateVm={estateVm}
          selectedScenario={selectedScenario}
          scenarioBound={scenarioBound}
          onBoundChange={handleBoundChange}
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
          {/* Income history chart + payout history (SIMULATED — disclosure kept) */}
          <IncomeAnalytics listing={listing} />

          {/* Projections calculator — the estate's income projections */}
          <IncomeCalculator
            listing={listing}
            shares={previewShares}
            onSharesChange={onSharesChange}
            ownedShares={ownedShares}
            lockedShares={lockedShares}
            onBuy={onBuyShares}
            currentPriceUsd={currentPriceUsd}
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

          {/* Holder analytics (SIMULATED buckets — disclosure kept) */}
          <HolderAnalytics listing={listing} />
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

          {/* About + More details */}
          <PropertyAbout
            listing={listing}
            aboutText={estateVm.aboutText}
            sizeText={estateVm.sizeText}
            displayName={estateVm.identity?.name}
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
