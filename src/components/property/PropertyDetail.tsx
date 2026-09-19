"use client";
// File responsibility: compose the Estate Detail layout — the 4-tab
// architecture (Estate | Income | Ownership | Details) per the locked Estate
// Page Structure (docs/design/ESTATE-PAGE-STRUCTURE.md):
// - L0 fixed top section: gallery + hero (name, location, price/fraction,
//   funding bar, estate value, Buy + withdrawal-terms note) — preserved.
// - L1 fixed 4-stat section: Monthly Income · Proj./Year · Avg. Nightly Rate ·
//   Est. Growth (Base-scenario figures via the single presentation path).
// - L2 tabs: Estate (desire) · Income (conviction, Base default) · Ownership
//   (decision) · Details (truth). Buy/sell/lock sheets, the sticky chrome and
//   all flows stay page-owned below (P1–P6 untouched).
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import type { EstateVerification } from "@/types/verification";
import type { EstateStayInfo } from "@/types/stay";
import { getCurrentSharePrice } from "@/lib/property-price";
import { getFinancialModelV1 } from "@/lib/economics/estates/financial-model-v1-inputs";
import { CANONICAL_BASE_PRICE_USD } from "@/lib/economics/canonical-offering";
import { useEstateDetailViewModel } from "@/hooks/useEstateDetailViewModel";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyHero } from "./PropertyHero";
import { PropertyMetricsGrid } from "./PropertyMetricsGrid";
import { PropertyTabs, type PropertyTabId } from "./PropertyTabs";
import { EstateTabPanel } from "./estate-tab";
import { IncomeTabPanel } from "./income-tab";
import { OwnershipTabPanel } from "./ownership-tab";
import { EarnTabPanel } from "./earn-tab";
import { DetailsTabPanel } from "./details-tab";

export function PropertyDetail({
  listing,
  orderBook,
  onBuy,
  ownedShares = 0,
  lockedShares = 0,
  avgCostUsd,
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
  /** Accrued unpaid yield across this property's active locks (display only). */
  accruedUnpaidUsd?: number;
  /** Optional verification snapshot — renders only when genuinely verified. */
  verification?: EstateVerification;
  /** Owner Stay snapshot — honest unavailable until a real source exists. */
  stay?: EstateStayInfo;
}) {
  // Layer-1: funding = Primary; funded/resale = Secondary.
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

  // Canonical view-model via the hooks boundary (UI never touches engines
  // directly). Identity/valuation/share states flow from here; V1 projected
  // economics arrive as estateVm.v1 (sole calculation authority).
  const { vm: estateVm } = useEstateDetailViewModel(listing, {
    asks: orderBook?.asks,
    sharesOwned: ownedShares,
    acquisitionPricePerShareUsd: avgCostUsd ?? null,
  });

  // Phase 8 (#06) — keep the viewport stable when swapping tab panels: panels
  // have very different heights, and the browser clamps the scroll offset
  // mid-swap when the new panel is shorter. Capture on switch, restore after
  // mount, clamped to the new document height.
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

  // Sold-out primary hero CTA → open the resale block on the Estate tab and
  // bring it into view (collapsed by default — "View Resale Opportunities").
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

  // Single source of truth for "current share price" — computed ONCE here and
  // fed to every price display (lib/property-price). No section re-derives it.
  const currentPriceUsd = getCurrentSharePrice(listing, { bestAskUsd: orderBook?.bestAskUsd });
  // V1 canonical fractionalization for the hero share line (Ownership-tab
  // percentage for 1 share, e.g. 0.0013% for Grand).
  // Falls back to the listing supply only without a V1 input (never the 24).
  const v1ForHero = getFinancialModelV1(listing.id);
  const heroTotalShares = v1ForHero?.totalShares ?? listing.totalShares;
  // Resale block renders for secondary listings AND sold-out primary offerings.
  const hasResaleSurface = !isPrimary || listing.sharesRemaining <= 0;
  // Whether owned shares scale with V1 per-share (same $100 share class).
  const scalePosition = listing.sharePriceUsd === CANONICAL_BASE_PRICE_USD;

  return (
    <div className="space-y-4" data-testid="property-detail">
      {/* ═══ L0 — Estate header (gallery + hero) — preserved ═══ */}
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
          canonicalCountry={estateVm.estate24?.location.country ?? null}
          totalSharesOverride={heroTotalShares}
        />
      </div>

      {/* ═══ L1 — fixed 4-stat section (Base-scenario presented figures) ═══ */}
      <PropertyMetricsGrid listing={listing} v1={estateVm.v1} />

      {/* ═══ L2 — tabs ═══ */}
      <PropertyTabs active={tab} onChange={handleTabChange} />

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
          canBuy={canBuy}
        />
      ) : null}

      {tab === "income" ? (
        <IncomeTabPanel
          v1={estateVm.v1}
          propertyId={listing.id}
          accruedUnpaidUsd={accruedUnpaidUsd}
          ownedShares={ownedShares}
          scalePosition={scalePosition}
        />
      ) : null}

      {tab === "ownership" ? (
        <OwnershipTabPanel
          listing={listing}
          estateVm={estateVm}
          ownedShares={ownedShares}
          stay={stay}
        />
      ) : null}

      {tab === "earn" ? (
        <EarnTabPanel
          listing={listing}
          estateVm={estateVm}
          currentPriceUsd={currentPriceUsd}
          orderBook={orderBook}
          ownedShares={ownedShares}
          lockedShares={lockedShares}
          avgCostUsd={avgCostUsd}
          accruedUnpaidUsd={accruedUnpaidUsd}
          onBuy={onBuy}
        />
      ) : null}

      {tab === "details" ? (
        <DetailsTabPanel listing={listing} estateVm={estateVm} verification={verification} />
      ) : null}
    </div>
  );
}
