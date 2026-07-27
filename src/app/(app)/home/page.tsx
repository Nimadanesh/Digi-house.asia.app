"use client";
// File responsibility: Home screen composition (Fable Home). GlobalHeader is provided by AppShell.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useTelegram } from "@/hooks/useTelegram";
import { pickFeaturedListing } from "@/lib/home-featured";
import { PortfolioValueCard } from "@/components/home/PortfolioValueCard";
import { NextPayoutCard } from "@/components/home/NextPayoutCard";
import { MyPropertiesSection } from "@/components/home/MyPropertiesSection";
import { FeaturedPropertyCard } from "@/components/home/FeaturedPropertyCard";
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
  const { haptics } = useTelegram();

  const listingById = useMemo(() => {
    const map = new Map((marketplace.data ?? []).map((p) => [p.id, p]));
    return map;
  }, [marketplace.data]);

  const featured = useMemo(
    () => pickFeaturedListing(marketplace.data ?? []),
    [marketplace.data],
  );

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

  const tap = () => haptics.selection();

  return (
    <div className="mt-1 space-y-3 pb-2" data-testid="home-page">
      <PortfolioValueCard summary={summary} onNavigateHaptic={tap} />
      <NextPayoutCard projectedUsd={projectedNext} onNavigateHaptic={tap} />
      <MyPropertiesSection
        holdings={summary.holdings}
        listingById={listingById}
        onNavigateHaptic={tap}
      />
      {featured ? (
        <FeaturedPropertyCard listing={featured} onNavigateHaptic={tap} />
      ) : null}
    </div>
  );
}
