"use client";
// File responsibility: Income page (Phase 9 Slice 5 — redesign §10 / UI Mapping §7,
// plus Slice I explicit economic states). Income identity first (H1 + subtitle),
// then: received-in-total hero → accrued block → chart (actual/projected) →
// Paid/Accrued/Expected timeline → income by estate (extended with position states)
// → payout-status pipeline (eligible/requested/scheduled/paid-out) → other
// investment returns (plan/appreciation/secondary, never income) → origin
// explainer → secondary Withdraw entry. Rental-income semantics per §7.3: status
// words only, never frequency promises. UI via hooks only; property metadata from
// the existing marketplace contract (no API changes).
import { useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { useEarnings } from "@/hooks/useEarnings";
import { useMarketplace } from "@/hooks/useMarketplace";
import { useLocks, useMeSummary } from "@/hooks/useLocks";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useWithdrawals } from "@/hooks/useWithdrawals";
import { useTransactions } from "@/hooks/useTransactions";
import { haptics } from "@/lib/telegram/haptics";
import { secondaryGains } from "@/lib/income-view-model";
import {
  getEstateDisplayIdentity,
  type EstateDisplayIdentity,
} from "@/lib/economics/estates/estate-display-identity";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { BrowseMarketplaceCta } from "@/components/common/BrowseMarketplaceCta";
import { EarningsHeroCard } from "@/components/earnings/EarningsHeroCard";
import { YieldSummaryCard } from "@/components/earnings/YieldSummaryCard";
import { IncomeJourneyChart } from "@/components/earnings/IncomeJourneyChart";
import { IncomeTimeline } from "@/components/earnings/IncomeTimeline";
import { IncomeByEstate } from "@/components/earnings/IncomeByEstate";
import { DistributionStatus } from "@/components/earnings/DistributionStatus";
import { OtherReturns } from "@/components/earnings/OtherReturns";
import { OperatingIncomeExplainer } from "@/components/earnings/OperatingIncomeExplainer";
import { EarningsTransactionHistory } from "@/components/earnings/EarningsTransactionHistory";
import { EarningsWithdrawEntry } from "@/components/earnings/EarningsWithdrawEntry";
import { EarningsSkeleton } from "@/components/earnings/EarningsSkeleton";

export default function EarningsPage() {
  const t = useTranslations("earnings");
  const earnings = useEarnings();
  const { data: listings } = useMarketplace();
  const locksQuery = useLocks();
  const meSummary = useMeSummary();
  const portfolio = usePortfolio();
  const withdrawals = useWithdrawals();
  const { transactions, isLoading: txLoading } = useTransactions();
  const heroRef = useRef<HTMLElement>(null);

  // PROMPT 03-C: canonical display identity (ESTATE-24 / canonical layer) for
  // the Income surfaces. Economics (gains below) keep the listing facts.
  const estateIdentityById = useMemo(
    () =>
      new Map<string, EstateDisplayIdentity>(
        (listings ?? []).map((p) => [
          p.id,
          getEstateDisplayIdentity(p.id, {
            title: p.title,
            location: p.location,
            images: p.images,
          }),
        ]),
      ),
    [listings],
  );

  const listingGains = useMemo(
    () =>
      portfolio.data
        ? secondaryGains({
            orders: portfolio.data.openOrders,
            holdings: portfolio.data.holdings,
            listings: listings ?? [],
          })
        : undefined,
    [portfolio.data, listings],
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
    <div className="mt-3 space-y-6 pb-6 sm:space-y-8" data-testid="earnings-page">
      <header className="pt-1">
        <h1 className="text-[1.375rem] font-semibold tracking-tight text-foreground">
          {t("title")}
        </h1>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
          {t("subtitle")}
        </p>
      </header>

      {/* 1. Hero Summary */}
      <section ref={heroRef} aria-label={t("totalEarned")}>
        <EarningsHeroCard summary={earnings.data} />
      </section>
      {/* 2. Quick Snapshot */}
      {earnings.data.yield ? (
        <YieldSummaryCard summary={earnings.data.yield} />
      ) : null}
      {/* 3. Income Journey */}
      <IncomeJourneyChart
        entries={earnings.data.entries}
        propertyById={estateIdentityById}
        accruedUsd={earnings.data.yield?.accruedUnpaidUsd}
      />
      {/* 4. Your Income Flow */}
      <IncomeTimeline
        entries={earnings.data.entries}
        projectedNextUsd={earnings.data.projectedNextWeekUsd}
        accruedUsd={earnings.data.yield?.accruedUnpaidUsd}
      />
      {/* 5. Income by Estate */}
      <IncomeByEstate
        entries={earnings.data.entries}
        propertyById={estateIdentityById}
        holdings={portfolio.data?.holdings}
        locks={locksQuery.data?.locks}
      />
      {/* 7. Payout Status (accordion) */}
      <DistributionStatus
        withdrawals={withdrawals.data}
        withdrawableUsd={meSummary.data?.balances.withdrawableUsd ?? null}
      />
      {/* 8. Other Returns (accordion) */}
      <OtherReturns gains={listingGains} />
      <OperatingIncomeExplainer />
      {/* 6. Recent Activity */}
      <EarningsTransactionHistory transactions={transactions} isLoading={txLoading} />
      {/* Sticky Withdraw bar (appears past the hero) */}
      <EarningsWithdrawEntry heroRef={heroRef} />
    </div>
  );
}
