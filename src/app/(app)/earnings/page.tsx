"use client";
// File responsibility: Earnings hero page (Fable Earnings polish).
// UI via hooks only. Row expand holds the single discrete demo disclaimer (not on collapsed rows).
import { useMemo } from "react";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTelegram } from "@/hooks/useTelegram";
import { weeklyRent } from "@/lib/format";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { EarningsHeroCard } from "@/components/earnings/EarningsHeroCard";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { EarningsTimeline } from "@/components/earnings/EarningsTimeline";
import { EarningsSkeleton } from "@/components/earnings/EarningsSkeleton";

export default function EarningsPage() {
  const earnings = useEarnings();
  const marketplace = useMarketplace();
  const portfolio = usePortfolio();
  const { haptics } = useTelegram();

  const properties = marketplace.data;
  const propertyNameById = useMemo(
    () => Object.fromEntries((properties ?? []).map((p) => [p.id, p.title])),
    [properties],
  );
  const propertyImageById = useMemo(
    () => Object.fromEntries((properties ?? []).map((p) => [p.id, p.images[0] ?? ""])),
    [properties],
  );
  const weeklyRentPoolUsdById = useMemo(
    () => Object.fromEntries((properties ?? []).map((p) => [p.id, weeklyRent(p.annualRentUsd)])),
    [properties],
  );
  const holdings = portfolio.data?.holdings;
  const sharesOwnedById = useMemo(
    () => Object.fromEntries((holdings ?? []).map((h) => [h.propertyId, h.sharesOwned])),
    [holdings],
  );

  if (earnings.isLoading && !earnings.data) {
    return (
      <div className="mt-3">
        <EarningsSkeleton />
      </div>
    );
  }

  if (earnings.isError && !earnings.data) {
    return (
      <ErrorState
        className="mt-4"
        message="Couldn't load earnings."
        onRetry={() => {
          haptics.impact("light");
          void earnings.refetch();
        }}
        data-testid="earnings-error"
      />
    );
  }

  if (!earnings.data || earnings.data.entries.length === 0) {
    return (
      <EmptyState
        title="You haven't earned yet"
        message="Buy your first share and start earning next week."
        action={<BrowseMarketplaceCta />}
        className="mt-12"
        data-testid="earnings-empty"
      />
    );
  }

  return (
    <div className="mt-3 space-y-4 pb-2" data-testid="earnings-page">
      <EarningsHeroCard summary={earnings.data} />
      <WeeklyEarningsChart entries={earnings.data.entries} />
      <EarningsTimeline
        entries={earnings.data.entries}
        propertyNameById={propertyNameById}
        propertyImageById={propertyImageById}
        weeklyRentPoolUsdById={weeklyRentPoolUsdById}
        sharesOwnedById={sharesOwnedById}
      />
    </div>
  );
}
