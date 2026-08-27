"use client";
// File responsibility: Home screen composition (redesign — "calm money, clear next step").
// Calm portfolio hero → static next-payout summary → My Properties (max 3) → one editorial
// Featured Opportunity → a short More-opportunities rail of Primary listings → quiet trust footer.
import { useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { haptics } from "@/lib/telegram/haptics";
import { pickFeaturedListing } from "@/lib/home-featured";
import { PortfolioValueCard } from "@/components/home/PortfolioValueCard";
import { NextPayoutSummary } from "@/components/money/NextPayoutSummary";
import { MyPropertiesSection } from "@/components/home/MyPropertiesSection";
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
  const projectedNext =
    earnings.data?.thisWeekProjectedUsd ?? summary.weeklyProjectedUsd;

  return (
    <div className="mt-1 space-y-3 pb-2" data-testid="home-page">
      <PortfolioValueCard summary={summary} onNavigateHaptic={tap} />
      <NextPayoutSummary projectedUsd={projectedNext} onNavigateHaptic={tap} />
      <MyPropertiesSection
        holdings={holdings}
        listingById={listingById}
        onNavigateHaptic={tap}
      />
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