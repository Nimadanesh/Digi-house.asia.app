"use client";
// File responsibility: compose the Property detail layout — Phase 1 foundation
// (REDESIGN-SPEC §4/§7): header (gallery + hero) + KPI grid, then a 5-tab
// architecture (Overview | Performance | Holders | Income | Details).
//
// Phase 1 branching rules:
// - Overview: ownership banner + calculator + yield/lock (relocated existing content).
// - Performance: Secondary keeps the existing PerformanceChart + MarketSection;
//   PRIMARY NEVER RENDERS A PRICE CHART (spec §10 strict) — it gets a calm
//   "funding story" placeholder with no price series and no fake volatility.
// - Holders/Income: tab shells with honest "coming in a later update" copy
//   (no simulated holder/income datasets until Phase 4).
// - Details: about + documents + similar (relocated existing content).
//
// The primary action (Buy sheet, MainButton) stays page-owned in route page.tsx.
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { DocumentMeta } from "@/types/property-document";
import { getCurrentSharePrice } from "@/lib/property-price";
import { usd } from "@/lib/format";
import dynamic from "next/dynamic";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyHero } from "./PropertyHero";
import { PropertyMetricsGrid } from "./PropertyMetricsGrid";
import { PropertyTabs, type PropertyTabId } from "./PropertyTabs";
import { FundingPanel } from "./FundingPanel";
import { PropertyFundamentals } from "./PropertyFundamentals";
import { IncomeCalculator } from "./IncomeCalculator";
import { MarketSection } from "./MarketSection";
import { PositionCard } from "./PositionCard";
import { OwnershipBanner } from "./OwnershipBanner";
import { YieldLockSection } from "./YieldLockSection";
import { PropertyTrust } from "./PropertyTrust";
import { PropertyAbout } from "./PropertyAbout";
import { SimilarProperties } from "./SimilarProperties";
import { PropertyDocumentsList } from "@/components/documents/PropertyDocumentsList";

// Phase 8 performance: the heavy analytics tab panels (Phase 5–7 chart suites)
// are code-split and loaded on demand — the Overview (default tab) ships without
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
const PrimaryPerformanceCharts = dynamic(
  () => import("./PrimaryPerformanceCharts").then((m) => m.PrimaryPerformanceCharts),
  {
    loading: () => <TabPanelSkeleton />,
    ssr: false,
  },
);
const SecondaryPerformanceCharts = dynamic(
  () => import("./SecondaryPerformanceCharts").then((m) => m.SecondaryPerformanceCharts),
  {
    loading: () => <TabPanelSkeleton />,
    ssr: false,
  },
);

/** Skeleton matching the tab-panel block rhythm (Phase 8 loading states). */
function TabPanelSkeleton() {
  return (
    <div className="space-y-5" data-testid="tab-panel-skeleton">
      {[0, 1, 2].map((i) => (
        <Block key={i} className="space-y-3 p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-[200px] w-full" />
        </Block>
      ))}
    </div>
  );
}

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
}) {
  const t = useTranslations("property");
  // REDESIGN-SPEC §4.4 — funding = Primary; funded/resale = Secondary.
  const isPrimary = listing.status === "funding";
  const [tab, setTab] = useState<PropertyTabId>("overview");
  const scrollYBeforeTabRef = useRef<number | null>(null);

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

  // Single source of truth for "current share price" — computed ONCE here and fed to
  // every price display (lib/property-price). No section may re-derive it.
  const currentPriceUsd = getCurrentSharePrice(listing, { bestAskUsd: orderBook?.bestAskUsd });

  return (
    <div className="space-y-4" data-testid="property-detail">
      {/* ═══ Layer A — Property Overview header (spec §4/§5) ═══ */}
      <PropertyGallery images={listing.images} title={listing.title} />
      <div className="px-0">
        <PropertyHero listing={listing} bestAskUsd={orderBook?.bestAskUsd} onBuy={onBuy} />
      </div>

      {/* §6 KPI area — available data only (no holders/payout metrics until that data exists) */}
      <PropertyMetricsGrid listing={listing} currentPriceUsd={currentPriceUsd} />

      {/* §7 Tabs — horizontal scroll, immediate switch */}
      <PropertyTabs active={tab} onChange={handleTabChange} />

      {/* ═══ Tab panels ═══ */}
      {tab === "overview" ? (
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          className="space-y-5"
          data-testid="panel-overview"
        >
          {/* §8 Phase 2 — Primary funding visualization leads the Overview (calm, no urgency) */}
          {isPrimary ? <FundingPanel listing={listing} /> : null}

          {/* §9 Phase 3 — Secondary market summary leads the Overview when not primary */}
          {!isPrimary ? <MarketSection listing={listing} orderBook={orderBook} /> : null}

          {/* §9 Phase 3 — Secondary position card (total/locked/free/accrued/value + Lock/Sell) */}
          {!isPrimary ? (
            <PositionCard
              listing={listing}
              ownedShares={ownedShares}
              lockedShares={lockedShares}
              accruedUnpaidUsd={accruedUnpaidUsd}
              avgCostUsd={avgCostUsd}
              currentPriceUsd={currentPriceUsd}
            />
          ) : (
            /* Phase 6 — ownership banner (hidden while unknown / owns nothing) */
            <OwnershipBanner
              listing={listing}
              ownedShares={ownedShares}
              lockedShares={lockedShares}
              avgCostUsd={avgCostUsd}
            />
          )}

          {/* §3.3 Investment Calculator */}
          <IncomeCalculator
            listing={listing}
            shares={previewShares}
            onSharesChange={onSharesChange}
            ownedShares={ownedShares}
            lockedShares={lockedShares}
            onBuy={onBuyShares}
            currentPriceUsd={currentPriceUsd}
          />

          {/* §8 Phase 2 — Primary property fundamentals (existing data only) */}
          {isPrimary ? <PropertyFundamentals listing={listing} /> : null}

          {/* Phase 6 — yield + lock/unlock flow */}
          <YieldLockSection listing={listing} />

          {/* §8 Phase 2 — Primary trust content stays on the Overview hierarchy */}
          {isPrimary ? <PropertyTrust listing={listing} /> : null}
        </div>
      ) : null}

      {tab === "performance" ? (
        <div
          role="tabpanel"
          id="panel-performance"
          aria-labelledby="tab-performance"
          className="space-y-5"
          data-testid="panel-performance"
        >
          {isPrimary ? (
            /* §10 STRICT: Primary never gets a price chart — no fake market.
               Phase 5: funding progress + cumulative shares from the shared
               deterministic funding dataset (Phase 4). */
            <div className="space-y-2" data-testid="primary-performance-note">
              <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
                {t("tabPerformance")}
              </h2>
              <Block className="space-y-2 p-4">
                <p className="text-sm leading-relaxed text-foreground">
                  {t("primaryFixedPrice", {
                    title: listing.title,
                    price: usd(listing.sharePriceUsd),
                  })}
                </p>
              </Block>
              <PrimaryPerformanceCharts listing={listing} />
            </div>
          ) : (
            /* §11 Phase 5 — full market analytics from the shared Phase 4 datasets:
                price/yield chart + OHLC + volume + timeframe selector */
            <SecondaryPerformanceCharts listing={listing} anchorUsd={currentPriceUsd} />
          )}
        </div>
      ) : null}

      {tab === "holders" ? (
        <div
          role="tabpanel"
          id="panel-holders"
          aria-labelledby="tab-holders"
          className="space-y-5"
          data-testid="panel-holders"
        >
          {/* §12 — Phase 6. Holder analytics from the shared Phase 4
              holder/ownership datasets (anonymized buckets, no PII). */}
          <HolderAnalytics listing={listing} />
        </div>
      ) : null}

      {tab === "income" ? (
        <div
          role="tabpanel"
          id="panel-income"
          aria-labelledby="tab-income"
          className="space-y-5"
          data-testid="panel-income"
        >
          {/* §13 — Phase 7. Income history chart + payout history + ratios from
              the shared Phase 4 incomeHistory/metrics datasets. The calculator
              (projections) already lives on Overview and is preserved. */}
          <IncomeAnalytics listing={listing} />
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
          {/* §3.6 Trust & Social Proof — Secondary keeps it here; Primary already
              carries it on the Overview hierarchy (Phase 2) */}
          {!isPrimary ? <PropertyTrust listing={listing} /> : null}

          {/* §3.7 About + More details */}
          <PropertyAbout listing={listing} />

          {/* §3.8 Documents */}
          {onDownloadDoc ? (
            <PropertyDocumentsList
              documents={documents}
              onDownload={onDownloadDoc}
              downloadingId={downloadingDocId}
              error={documentsError}
            />
          ) : null}

          {/* §3.9 Similar Properties */}
          <SimilarProperties listing={listing} />
        </div>
      ) : null}
    </div>
  );
}
