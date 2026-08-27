"use client";
// File responsibility: Earnings page (redesign — "calm money, clear next step").
// Total-earned hero → static 12-week chart → Paid/Accruing/Next timeline → Earning power →
// secondary Withdraw entry. UI via hooks only.
import { useTranslations } from "next-intl";
import { useEarnings } from "@/hooks/useEarnings";
import { haptics } from "@/lib/telegram/haptics";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { EarningsHeroCard } from "@/components/earnings/EarningsHeroCard";
import { YieldSummaryCard } from "@/components/earnings/YieldSummaryCard";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { IncomeTimeline } from "@/components/earnings/IncomeTimeline";
import { EarningsWithdrawEntry } from "@/components/earnings/EarningsWithdrawEntry";
import { EarningsSkeleton } from "@/components/earnings/EarningsSkeleton";

export default function EarningsPage() {
  const t = useTranslations("earnings");
  const earnings = useEarnings();

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
        message={t("loadError")}
        onRetry={() => {
          haptics.impact("light");
          void earnings.refetch();
        }}
        data-testid="earnings-error"
      />
    );
  }

  if (!earnings.data || (earnings.data.entries.length === 0 && !earnings.data.yield)) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        message={t("emptyMessage")}
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
      <IncomeTimeline
        entries={earnings.data.entries}
        projectedNextUsd={earnings.data.projectedNextWeekUsd}
      />
      {earnings.data.yield ? <YieldSummaryCard summary={earnings.data.yield} /> : null}
      <EarningsWithdrawEntry />
    </div>
  );
}