"use client";
// File responsibility: Home screen composition (Phase 9 Slice 3 — ownership-first, UI Mapping §3.1).
// Your Estates ownership hero (or an estates empty state) → Next Distribution (Expected, hidden when
// nothing is scheduled) → My Estates preview (max 3) → Featured Estate → More Estates (max 3) →
// quiet trust footer. One dominant CTA: "View My Estates" on the hero.
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { haptics } from "@/lib/telegram/haptics";
import { pickFeaturedListing } from "@/lib/home-featured";
import { YourEstatesCard } from "@/components/home/YourEstatesCard";
import { NextPayoutSummary } from "@/components/money/NextPayoutSummary";
import { MyPropertiesSection } from "@/components/home/MyPropertiesSection";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { FeaturedPropertyCard } from "@/components/home/FeaturedPropertyCard";
import { MoreOpportunitiesSection, pickMoreOpportunities } from "@/components/home/MoreOpportunitiesSection";
import { HomeTrustFooter } from "@/components/home/HomeTrustFooter";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { ErrorState } from "@/components/common/ErrorState";
import type { PortfolioSummary } from "@/types/position";

const EMPTY_SUMMARY: PortfolioSummary = {
  totalValueUsd: 0,
  totalInvestedUsd: 0,
  totalEarningsUsd: 0,
  weeklyProjectedUsd: 0,
  dayChangeRatio: 0,
  holdings: [],
  openOrders: [],
};

export default function HomePage() {
  const t = useTranslations("home");
  const portfolio = usePortfolio();
  const earnings = useEarnings();
  const marketplace = useMarketplace();

  const listingById = useMemo(() => {
    const map = new Map((marketplace.data ?? []).map((p) => [p.id, p]));
    return map;
  }, [marketplace.data]);

  const featured = useMemo(
    () => pickFeaturedListing(marketplace.data ?? []),
    [marketplace.data],
  );

  // A short calm rail of additional Primary (funding) listings, not the Featured one.
  const moreOpportunities = useMemo(
    () => pickMoreOpportunities(marketplace.data ?? [], featured?.id),
    [marketplace.data, featured?.id],
  );

  const holdings = portfolio.data?.holdings ?? EMPTY_SUMMARY.holdings;
  const hasOwnership = holdings.length > 0;

  // Next distribution is only shown when a real scheduled/paid entry exists — never a fake "0"
  // (UI Mapping §3.1). The scheduled amount comes from the earnings repo contract.
  const hasNextDistribution =
    hasOwnership &&
    ((earnings.data?.entries ?? []).some((e) => e.status === "pending") ||
      (earnings.data?.thisWeekProjectedUsd ?? 0) > 0);

  const projectedNext = hasNextDistribution
    ? (earnings.data?.thisWeekProjectedUsd ?? 0)
    : 0;

  const tap = useCallback(() => haptics.selection(), []);

  if (portfolio.isLoading && !portfolio.data) {
    return <HomeSkeleton />;
  }

  if (portfolio.isError && !portfolio.data) {
    return (
      <div className="space-y-3" data-testid="home-error">
        <ErrorState
          message={t("loadError")}
          onRetry={() => {
            haptics.impact("light");
            void portfolio.refetch();
          }}
        />
      </div>
    );
  }

  const summary = portfolio.data ?? EMPTY_SUMMARY;

  return (
    <div className="mt-1 space-y-3 pb-2" data-testid="home-page">
      {hasOwnership ? <YourEstatesCard summary={summary} onNavigateHaptic={tap} /> : <HomeEmptyState onNavigateHaptic={tap} />}
      {hasNextDistribution ? (
        <NextPayoutSummary projectedUsd={projectedNext} onNavigateHaptic={tap} />
      ) : null}
      {hasOwnership ? (
        <MyPropertiesSection
          holdings={holdings}
          listingById={listingById}
          onNavigateHaptic={tap}
        />
      ) : null}
      {featured ? (
        <FeaturedPropertyCard listing={featured} onNavigateHaptic={tap} />
      ) : null}
      {moreOpportunities.length > 0 ? (
        <MoreOpportunitiesSection
          listings={moreOpportunities}
          onNavigateHaptic={tap}
        />
      ) : null}
      <HomeTrustFooter />
    </div>
  );
}