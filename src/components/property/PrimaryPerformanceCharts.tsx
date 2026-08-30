"use client";
// File responsibility: Primary Performance charts (REDESIGN-SPEC Phase 5 / §10).
// Funding Progress Over Time + Cumulative Shares Sold, both from the Phase 4
// shared fundingHistory dataset (lib/property-analytics). STRICT: no price
// series, no price volatility — the offering price is fixed.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { getPropertyAnalytics, sliceRange, type AnalyticsRange } from "@/lib/property-analytics";
import { usd } from "@/lib/format";
import { Block } from "@/components/common/Block";
import {
  CHART_W,
  CHART_H,
  GridLines,
  DateLabels,
  buildPaths,
  RangePills,
} from "./charts/shared";

const RANGES: AnalyticsRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

function rangeLabel(r: AnalyticsRange): string {
  return r === "ALL" ? "All" : r;
}

/**
 * Primary Performance panel — two coherent funding charts from ONE dataset.
 * No timeframe state is shared with the Secondary chart; each panel owns its own.
 */
export function PrimaryPerformanceCharts({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const [range, setRange] = useState<AnalyticsRange>("1Y");

  const analytics = useMemo(() => getPropertyAnalytics(listing), [listing]);
  const funding = useMemo(
    () => (analytics.fundingHistory ? sliceRange(analytics.fundingHistory, range) : []),
    [analytics, range],
  );

  // Chart 1 — funding progress % over time (0..1).
  const progress = funding.map((p) => p.progressRatio);
  // Chart 2 — cumulative shares sold (same walk, integer counts).
  const shares = funding.map((p) => p.sharesSold);

  const progressPaths = useMemo(() => buildPaths(progress), [progress]);
  const sharesPaths = useMemo(() => buildPaths(shares), [shares]);

  const lastProgress = progress[progress.length - 1] ?? 0;
  const lastShares = shares[shares.length - 1] ?? 0;
  // Calm Telegram blue — funding progress is opportunity, not up/down finance.
  const stroke = "var(--color-primary, #3390ec)";

  return (
    <div className="space-y-5" data-testid="primary-performance-charts">
      {/* ── Chart 1: Funding Progress Over Time ── */}
      <Block className="space-y-3 p-4" data-testid="funding-progress-chart">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("fundingProgressTitle")}
        </h3>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          role="img"
          aria-label={t("fundingProgressTitle")}
          aria-describedby="funding-progress-summary"
          data-testid="funding-progress-svg"
        >
          <GridLines />
          <path d={progressPaths.areaPath} fill={stroke} opacity="0.08" />
          <path
            d={progressPaths.linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="funding-progress-line"
          />
          <DateLabels firstAt={funding[0]?.at ?? ""} lastAt={funding[funding.length - 1]?.at ?? ""} />
        </svg>
        {/* Screen-reader trend summary (funding progress rises monotonically). */}
        <p id="funding-progress-summary" className="sr-only">
          {t("chartTrendSummary", {
            direction: t("trendUp"),
            start: `${((progress[0] ?? 0) * 100).toFixed(0)}%`,
            end: `${(lastProgress * 100).toFixed(0)}%`,
          })}
        </p>
        {/* End-state readout as a quiet caption row — Level-2 meta, not a headline. */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("fundedCaptionShort", { pct: (lastProgress * 100).toFixed(0) })}</span>
          <span className="tnum" data-testid="funding-progress-end">
            {lastShares.toLocaleString()} / {listing.totalShares.toLocaleString()}
          </span>
        </div>
      </Block>

      {/* ── Chart 2: Cumulative Shares Sold ── */}
      <Block className="space-y-3 p-4" data-testid="cumulative-shares-chart">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("cumulativeSharesTitle")}
        </h3>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          role="img"
          aria-label={t("cumulativeSharesTitle")}
          aria-describedby="cumulative-shares-summary"
          data-testid="cumulative-shares-svg"
        >
          <GridLines />
          <path d={sharesPaths.areaPath} fill={stroke} opacity="0.08" />
          <path
            d={sharesPaths.linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="cumulative-shares-line"
          />
          <DateLabels firstAt={funding[0]?.at ?? ""} lastAt={funding[funding.length - 1]?.at ?? ""} />
        </svg>
        {/* Screen-reader trend summary (cumulative sales rise monotonically). */}
        <p id="cumulative-shares-summary" className="sr-only">
          {t("chartTrendSummary", {
            direction: t("trendUp"),
            start: (shares[0] ?? 0).toLocaleString(),
            end: lastShares.toLocaleString(),
          })}
        </p>
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          <span className="tnum" data-testid="cumulative-shares-end">
            {lastShares.toLocaleString()} / {listing.totalShares.toLocaleString()}
          </span>
        </div>
      </Block>

      {/* Timeframe pills — shared by both charts (same dataset). */}
      <RangePills
        ranges={RANGES}
        active={range}
        onChange={setRange}
        label={rangeLabel}
        testIdPrefix="primary"
      />

      {/* Yield projection — only from existing shared data (metrics), no new math. */}
      <Block className="space-y-2 p-4" data-testid="yield-projection">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("yieldProjectionTitle")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
              {t("annualRent")}
            </p>
            <p className="text-[1.375rem] font-bold leading-none text-foreground tnum">
              {usd(analytics.metrics.annualRentUsd)}
            </p>
          </div>
          <div>
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
              {t("grossYield")}
            </p>
            <p className="text-[1.375rem] font-bold leading-none text-foreground tnum">
              {(analytics.metrics.grossYieldRatio * 100).toFixed(1)}%
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("yieldProjectionNote")}
        </p>
      </Block>
    </div>
  );
}
