"use client";
// File responsibility: Secondary Performance charts (REDESIGN-SPEC Phase 5 / §11).
// Main price chart from the Phase 4 shared priceHistory/OHLC datasets, timeframe
// selector, volume underlay, Price↔Yield switch. No chart-local random series.
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import {
  getPropertyAnalytics,
  sliceRange,
  type AnalyticsRange,
  type PricePoint,
  type OhlcBar,
} from "@/lib/property-analytics";
import { usd } from "@/lib/format";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { Block } from "@/components/common/Block";
import {
  CHART_W,
  CHART_H,
  PAD_X,
  PAD_TOP,
  PAD_BOTTOM,
  GridLines,
  DateLabels,
  buildPaths,
  RangePills,
} from "./charts/shared";

const RANGES: AnalyticsRange[] = ["1M", "3M", "6M", "1Y", "ALL"];

function rangeLabel(r: AnalyticsRange): string {
  return r === "ALL" ? "All" : r;
}

type PerfTab = "price" | "yield";

/** Candle width in viewBox units for the OHLC overlay. */
function candleWidth(count: number): number {
  const step = (CHART_W - 2 * PAD_X) / Math.max(1, count);
  return Math.max(1.5, step * 0.6);
}

export function SecondaryPerformanceCharts({
  listing,
  anchorUsd,
}: {
  listing: Listing;
  /** Single source of truth (lib/property-price) — chart's end point. */
  anchorUsd: number;
}) {
  const t = useTranslations("property");
  const [tab, setTab] = useState<PerfTab>("price");
  const [range, setRange] = useState<AnalyticsRange>("1Y");
  const nowMs = useSharedNowMs();

  const analytics = useMemo(
    () => getPropertyAnalytics(listing, nowMs, { bestAskUsd: anchorUsd }),
    [listing, nowMs, anchorUsd],
  );

  const points: PricePoint[] = useMemo(
    () => (analytics.priceHistory ? sliceRange(analytics.priceHistory, range) : []),
    [analytics, range],
  );

  // OHLC exists in the Phase 4 dataset — candles available at every range.
  const ohlc: OhlcBar[] = useMemo(
    () => (analytics.ohlc ? sliceRange(analytics.ohlc, range) : []),
    [analytics, range],
  );

  // Yield series derived from the SAME price walk via existing annualYieldRatio
  // (annual rent ÷ implied total value at that week's price). No new math.
  const yieldSeries = useMemo(
    () =>
      points.map((p) => ({
        at: p.at,
        value: listing.totalShares * p.priceUsd > 0
          ? listing.annualRentUsd / (listing.totalShares * p.priceUsd)
          : 0,
      })),
    [points, listing.annualRentUsd, listing.totalShares],
  );

  const values = tab === "price" ? points.map((p) => p.priceUsd) : yieldSeries.map((y) => y.value);
  const { linePath, areaPath } = useMemo(() => buildPaths(values), [values]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || max || 1;
  const x = (i: number) => PAD_X + (i * (CHART_W - 2 * PAD_X)) / (points.length - 1);
  const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * (CHART_H - PAD_TOP - PAD_BOTTOM);

  const first = values[0] ?? 0;
  const last = values[points.length - 1] ?? 0;
  const up = last >= first;
  // Finance semantics: green up / red down only (DESIGN_SYSTEM contract).
  const stroke = up ? "var(--color-success, #3fb950)" : "var(--color-danger, #e53935)";
  const formatValue = (v: number) => (tab === "price" ? usd(v) : `${(v * 100).toFixed(1)}%`);

  // Yield-mode axis context: the property's ACTUAL gross yield (annual rent ÷
  // total value, existing fields) as a dashed reference line — the viewer can
  // judge whether the walked yield is above/below the asset's real economics.
  const grossYieldRatio =
    listing.totalValueUsd > 0 ? listing.annualRentUsd / listing.totalValueUsd : 0;
  const showYieldRef = tab === "yield" && grossYieldRatio > 0 && grossYieldRatio >= min && grossYieldRatio <= max;
  const yieldRefY = PAD_TOP + (1 - (grossYieldRatio - min) / span) * (CHART_H - PAD_TOP - PAD_BOTTOM);

  // Volume underlay — bottom 25% of the same SVG.
  const volumes = points.map((p) => p.volumeShares);
  const volMax = Math.max(...volumes, 1);
  const volBase = CHART_H - PAD_BOTTOM;
  const volHeight = 40;
  const vw = candleWidth(points.length);

  return (
    <div className="space-y-5" data-testid="secondary-performance-charts">
      <Block className="space-y-3 p-4" data-testid="price-chart">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[0.9375rem] font-semibold text-foreground">
            {t("performanceSectionTitle")}
          </h3>
          {/* Price | Yield switch */}
          <div className="flex rounded-[10px] bg-surface-2 p-1" data-testid="perf-tabs">
            {(["price", "yield"] as PerfTab[]).map((tb) => (
              <button
                key={tb}
                type="button"
                aria-pressed={tab === tb}
                onClick={() => setTab(tb)}
                className={`h-8 rounded-[8px] px-3 text-[0.8125rem] transition-colors duration-200 ease-out ${
                  tab === tb ? "bg-card font-semibold text-foreground" : "text-muted-foreground"
                }`}
                data-testid={`perf-tab-${tb}`}
              >
                {tb === "price" ? t("priceMode") : t("yieldMode")}
              </button>
            ))}
          </div>
        </div>

        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          role="img"
          aria-label={tab === "price" ? t("priceMode") : t("yieldMode")}
          aria-describedby="perf-chart-summary"
          data-testid="price-svg"
        >
          <GridLines />

          {/* Yield-mode reference: the asset's actual gross yield (dashed, muted) */}
          {showYieldRef ? (
            <g data-testid="yield-ref">
              <line
                x1={PAD_X}
                x2={CHART_W - PAD_X}
                y1={yieldRefY}
                y2={yieldRefY}
                stroke="currentColor"
                className="text-muted-foreground"
                strokeOpacity="0.55"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={CHART_W - PAD_X}
                y={yieldRefY - 4}
                fontSize="9"
                textAnchor="end"
                fontFamily="'Geist Mono', monospace"
                fill="currentColor"
                className="text-muted-foreground"
              >
                {(grossYieldRatio * 100).toFixed(1)}%
              </text>
            </g>
          ) : null}

          {/* OHLC candles — only when the shared dataset provides bars */}
          {tab === "price" && ohlc.length > 0
            ? ohlc.map((bar, i) => {
                const cx = x(i);
                const w = candleWidth(ohlc.length);
                const yHigh = y(bar.highUsd);
                const yLow = y(bar.lowUsd);
                const yOpen = y(bar.openUsd);
                const yClose = y(bar.closeUsd);
                const bull = bar.closeUsd >= bar.openUsd;
                const c = bull ? "var(--color-success, #3fb950)" : "var(--color-danger, #e53935)";
                return (
                  <g key={bar.at} data-testid={`candle-${i}`}>
                    <line x1={cx} x2={cx} y1={yHigh} y2={yLow} stroke={c} strokeWidth="1" />
                    <rect
                      x={cx - w / 2}
                      y={Math.min(yOpen, yClose)}
                      width={w}
                      height={Math.max(1, Math.abs(yClose - yOpen))}
                      fill={c}
                    />
                  </g>
                );
              })
            : null}

          {/* Area + line (price or yield) */}
          <path d={areaPath} fill={stroke} opacity="0.08" />
          <path
            d={linePath}
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="perf-line"
          />

          {/* Volume underlay */}
          {tab === "price"
            ? points.map((p, i) => {
                const h = (p.volumeShares / volMax) * volHeight;
                return (
                  <rect
                    key={p.at}
                    x={x(i) - vw / 2}
                    y={volBase - h}
                    width={vw}
                    height={h}
                    className="fill-primary/20"
                    data-testid={`volume-${i}`}
                  />
                );
              })
            : null}

          <DateLabels
            firstAt={points[0]?.at ?? ""}
            lastAt={points[points.length - 1]?.at ?? ""}
          />
        </svg>

        {/* Text trend summary for screen readers (not color-only): start → end with direction word. */}
        <p id="perf-chart-summary" className="sr-only">
          {t("chartTrendSummary", {
            direction: up ? t("trendUp") : t("trendDown"),
            start: formatValue(first),
            end: formatValue(last),
          })}
        </p>

        {/* Start / end value labels under the chart (readable, touch-safe) */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground tnum">{formatValue(first)}</span>
          {tab === "yield" ? (
            <span className="text-muted-foreground tnum" data-testid="yield-ref-caption">
              {t("grossYield")} {(grossYieldRatio * 100).toFixed(1)}%
            </span>
          ) : null}
          <span
            className={`font-semibold tnum ${up ? "text-success" : "text-danger"}`}
            data-testid="perf-end-price"
          >
            {formatValue(last)}
          </span>
        </div>

        <RangePills
          ranges={RANGES}
          active={range}
          onChange={setRange}
          label={rangeLabel}
          testIdPrefix="perf"
        />

        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("simulatedHistoryNote")}
        </p>
      </Block>
    </div>
  );
}
