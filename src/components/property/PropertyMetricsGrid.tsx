// File responsibility: compact KPI area — 2×2 decision metrics grid (Layer-1
// redesign). Only numbers a buyer decides with: price, projected monthly,
// funded % (primary; with a 4px mini-bar) or sold (secondary), projected per
// share / year. Total estate value moved to the hero's merged value line;
// sold/remaining lives in the funding bar. Monthly/annual figures are the V1
// PROJECTED per-share values (never the legacy yield-rate figure, never
// presented as paid); UNKNOWN renders the honest pending state.
import { useTranslations } from "next-intl";
import { eur, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { Listing } from "@/types/property";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import {
  getPresentedMonthlyIncome,
  getPresentedPrimaryPrice,
  presentedIncomeUnknownCaption,
} from "@/lib/economics/property-presentation";
import { Block } from "@/components/common/Block";

function MetricCell({
  label,
  value,
  className = "",
  hint,
  hintTestId,
  miniBar,
  testId,
}: {
  label: string;
  value: string;
  className?: string;
  /** Slice 3: short human-readable reason under a pending value (layout-safe caption). */
  hint?: string;
  hintTestId?: string;
  /** Layer-1: 4px scarcity mini-bar under the funded % value (primary only). */
  miniBar?: number;
  testId?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 p-3 min-h-[72px] min-w-0 ${className}`}>
      <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground leading-tight">{label}</span>
      <span className="truncate text-[1.25rem] font-semibold text-foreground tnum leading-tight" data-testid={testId}>{value}</span>
      {miniBar != null ? (
        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-warning/20">
          <div
            className="h-full rounded-full bg-warning"
            style={{ width: `${Math.min(100, Math.max(0, miniBar * 100))}%` }}
          />
        </div>
      ) : null}
      {hint != null ? (
        <span className="text-[0.6875rem] leading-tight text-muted-foreground" data-testid={hintTestId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function PropertyMetricsGrid({
  listing,
  currentPriceUsd,
  bestAskUsd,
  v1,
  totalSharesOverride,
}: {
  listing: Listing;
  /** Single source of truth (lib/property-price) — equals sharePriceUsd on primary. */
  currentPriceUsd?: number;
  /** Live book ask when known — labels the price basis honestly (Slice 4). */
  bestAskUsd?: number | null;
  /**
   * Financial Model V1 evaluation (PROMPT 05 sole authority for the monthly
   * figure). Absent → honest pending state (never the legacy yield-rate math).
   */
  v1?: FinancialModelV1PropertyModel | null;
  /** V1 canonical total (Layer 1) — the funded % denominator on primary. */
  totalSharesOverride?: number | null;
}) {
  const t = useTranslations("property");
  const monthly = v1?.perShare.monthlyCents ?? null;
  // Slice 3: a pending monthly figure always carries its human-readable reason
  // (single presentation layer — same classification as cards/calculator/buy).
  const incomeReason = presentedIncomeUnknownCaption(
    getPresentedMonthlyIncome(listing.id).unknownKind,
  );
  const perShare = v1?.perShare;
  const money = (cents: number) =>
    perShare?.currency === "EUR" ? eur(cents) : usd(cents);
  const monthlyText =
    monthly != null ? money(monthly) : unavailableLabel("backend_absent");
  const annualText =
    perShare?.annualCents != null
      ? money(perShare.annualCents)
      : unavailableLabel("backend_absent");
  const pricePerShare = currentPriceUsd ?? listing.sharePriceUsd;
  // Slice 4: the price label follows the price basis — the $100 primary offering,
  // a resale ask, or a last trade are never presented under one shared name.
  const isPrimary = listing.status === "funding";
  const askUsd = bestAskUsd ?? listing.bestAskUsd ?? null;
  const priceLabel = isPrimary
    ? t("sharePrice")
    : askUsd != null && pricePerShare === askUsd
      ? t("askPrice")
      : listing.lastTradeUsd != null && pricePerShare === listing.lastTradeUsd
        ? t("lastPrice")
        : t("sharePrice");
  // Slice 4: primary states the $100 base explicitly, where it applies.
  const primaryNote = isPrimary
    ? t("primaryBasePriceNote", { price: usd(getPresentedPrimaryPrice()) })
    : null;
  // Layer-1 scarcity cell: primary = funded % (denominator is the V1 canonical
  // total); secondary = demo-ledger sold count (the funded % is 0 by definition
  // there and would be dishonest noise).
  const totalForPct = totalSharesOverride ?? listing.totalShares;
  const fundedRatio = totalForPct > 0 ? listing.sharesSold / totalForPct : 0;

  return (
    <Block className="overflow-hidden" data-testid="metrics-grid">
      <div className="grid grid-cols-2">
        <MetricCell
          label={priceLabel}
          value={usd(pricePerShare)}
          className="border-b border-r border-border"
          hint={primaryNote ?? undefined}
          hintTestId={primaryNote != null ? "metrics-primary-note" : undefined}
          testId="metrics-price"
        />
        <MetricCell
          label={t("metricProjectedIncome")}
          value={monthlyText}
          className="border-b border-border"
          hint={incomeReason ?? undefined}
          hintTestId={incomeReason != null ? "metrics-income-reason" : undefined}
          testId="metrics-monthly"
        />
        {isPrimary ? (
          <MetricCell
            label={t("metricFunded")}
            value={t("fundedCaptionShort", { pct: Math.round(fundedRatio * 100) })}
            className="border-r border-border"
            miniBar={fundedRatio}
            testId="metrics-funded"
          />
        ) : (
          <MetricCell
            label={t("metricSold")}
            value={listing.sharesSold.toLocaleString()}
            className="border-r border-border"
            testId="metrics-sold"
          />
        )}
        <MetricCell
          label={t("metricAnnual")}
          value={annualText}
          testId="metrics-annual"
        />
      </div>
    </Block>
  );
}
