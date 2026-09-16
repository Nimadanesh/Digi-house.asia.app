"use client";
// File responsibility: Home screen composition — centered balance hero, default action
// row, Activity capsule (no payout row), single For-you slot.
// The tab header is shell-owned (AppHeader, transparent bar); the blue canvas gradient
// lives on the shell canvas so it paints behind the header too.
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useMarketplace } from "@/hooks/useMarketplace";
import { haptics } from "@/lib/telegram/haptics";
import { pickFeaturedListing } from "@/lib/home-featured";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeActions } from "@/components/home/HomeActions";
import { HomeDetailsSheet } from "@/components/home/HomeDetailsSheet";
import { HomeEstatesSheet } from "@/components/home/HomeEstatesSheet";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";
import { HomeActivity } from "@/components/home/HomeActivity";
import { HomeForYou } from "@/components/home/HomeForYou";
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
  const marketplace = useMarketplace();

  const featured = useMemo(
    () => pickFeaturedListing(marketplace.data ?? []),
    [marketplace.data],
  );

  // For-you precedence: featured picker first, else the first available listing.
  // (The picker already falls back past an empty Featured set, so this only bites
  // when the feed itself is empty — then there is honestly nothing buyable.)
  const forYouListing = featured ?? marketplace.data?.[0] ?? null;

  const holdings = portfolio.data?.holdings ?? EMPTY_SUMMARY.holdings;
  const hasOwnership = holdings.length > 0;

  const tap = useCallback(() => haptics.selection(), []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const openDetails = useCallback(() => setDetailsOpen(true), []);
  const closeDetails = useCallback(() => setDetailsOpen(false), []);
  const [estatesOpen, setEstatesOpen] = useState(false);
  const openEstates = useCallback(() => setEstatesOpen(true), []);
  const closeEstates = useCallback(() => setEstatesOpen(false), []);

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
    <div className="-mx-4 space-y-5 px-4 pb-6 pt-2" data-testid="home-page">
      <HomeHero summary={summary} onPill={openEstates} />
      <HomeActions onDetails={openDetails} />
      <HomeDetailsSheet open={detailsOpen} onClose={closeDetails} summary={summary} />
      <HomeEstatesSheet
        open={estatesOpen}
        onClose={closeEstates}
        holdings={holdings}
        listings={marketplace.data ?? []}
      />
      {hasOwnership ? null : <HomeEmptyState onNavigateHaptic={tap} />}
      {/* Unlocked-shares row hidden: free/unlocked is not exposed on PortfolioSummary
          (locks live behind useLocks on Portfolio), so the field is absent on Home. */}
      <HomeActivity />
      <HomeForYou listing={forYouListing} showInvite={!hasOwnership} />
    </div>
  );
}