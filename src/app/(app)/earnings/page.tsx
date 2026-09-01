"use client";
// File responsibility: Income page (Phase 9 Slice 5 — redesign §10 / UI Mapping §7).
// Income identity first (H1 + subtitle), then: received-in-total hero → accrued block →
// chart (actual/projected) → Paid/Accrued/Expected timeline → income by estate →
// secondary Withdraw entry. Rental-income semantics per §7.3: status words only, never
// frequency promises. UI via hooks only; property metadata from the existing marketplace
// contract (no API changes).
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { haptics } from "@/lib/telegram/haptics";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { EarningsHeroCard } from "@/components/earnings/EarningsHeroCard";
import { YieldSummaryCard } from "@/components/earnings/YieldSummaryCard";
import { WeeklyEarningsChart } from "@/components/earnings/WeeklyEarningsChart";
import { IncomeTimeline } from "@/components/earnings/IncomeTimeline";
import { IncomeByEstate } from "@/components/earnings/IncomeByEstate";
import { EarningsWithdrawEntry } from "@/components/earnings/EarningsWithdrawEntry";
import { EarningsSkeleton } from "@/components/earnings/EarningsSkeleton";

export default function EarningsPage() {
  const t = useTranslations("earnings");
  const earnings = useEarnings();
  const { data: listings } = useMarketplace();

  const propertyById = useMemo(
    () => new Map((listings ?? []).map((p) => [p.id, p])),
    [listings],
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
      <header className="pt-1">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      <EarningsHeroCard summary={earnings.data} />
      {earnings.data.yield ? <YieldSummaryCard summary={earnings.data.yield} /> : null}
      <WeeklyEarningsChart entries={earnings.data.entries} />
      <IncomeTimeline
        entries={earnings.data.entries}
        projectedNextUsd={earnings.data.projectedNextWeekUsd}
        accruedUsd={earnings.data.yield?.accruedUnpaidUsd}
      />
      <IncomeByEstate entries={earnings.data.entries} propertyById={propertyById} />
      <EarningsWithdrawEntry />
    </div>
  );
}
