"use client";
// File responsibility: "Performance" section — pure SVG editorial line chart with
// Price/Yield tabs and 1M/6M/1Y/All range pills (REDESIGN-SPEC Phase 3).
// Data comes from lib/performance-series (deterministic, anchored to current price).
import { useMemo, useState } from "react";
import type { Listing } from "@/types/property";
import { performanceSeries, type PerfRange } from "@/lib/performance-series";
import { usd } from "@/lib/format";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";

type PerfTab = "price" | "yield";

const RANGES: PerfRange[] = ["1M", "6M", "1Y", "ALL"];
// viewBox space — scales to container width (≤480px), keeps a fixed aspect.
const W = 440;
const H = 200;
const PAD_X = 8;
const PAD_TOP = 16;
const PAD_BOTTOM = 24;

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function PerformanceChart({
  listing,
  anchorUsd,
}: {
  listing: Listing;
  /** Single source of truth (lib/property-price) — chart's end point, defaults to list price. */
  anchorUsd?: number;
}) {
  const [tab, setTab] = useState<PerfTab>("price");
  const [range, setRange] = useState<PerfRange>("1Y");
  const nowMs = useSharedNowMs();

  const points = useMemo(
    () => performanceSeries(listing, range, nowMs, anchorUsd),
    [listing, range, nowMs, anchorUsd],
  );

  const values = points.map((p) => (tab === "price" ? p.priceUsd : p.yieldRatio));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || max || 1;

  const x = (i: number) => PAD_X + (i * (W - 2 * PAD_X)) / (points.length - 1);
  const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * (H - PAD_TOP - PAD_BOTTOM);

  const linePath = useMemo(
    () => points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(values[i]).toFixed(1)}`).join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, tab],
  );
  const areaPath = `${linePath} L ${x(points.length - 1).toFixed(1)} ${H - PAD_BOTTOM} L ${PAD_X} ${H - PAD_BOTTOM} Z`;

  const first = values[0];
  const last = values[points.length - 1];
  const up = last >= first;
  const formatValue = (v: number) => (tab === "price" ? usd(v) : `${(v * 100).toFixed(1)}%`);
  // Finance semantics: green up / red down only.
  const stroke = up ? "var(--color-success, #3fb950)" : "var(--color-danger, #f85149)";

  return (
    <Block className="space-y-3 p-4" data-testid="performance-chart">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">Performance</h2>
        {/* Price | Yield tabs */}
        <div className="flex rounded-[10px] bg-surface-2 p-1" data-testid="perf-tabs">
          {(["price", "yield"] as PerfTab[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => {
                haptics.selection();
                setTab(t);
              }}
              className={`h-8 w-16 rounded-[8px] text-[0.8125rem] capitalize transition-colors duration-200 ease-out ${
                tab === t ? "bg-card font-semibold text-foreground" : "text-muted-foreground"
              }`}
              data-testid={`perf-tab-${t}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Time range pills */}
      <div className="flex gap-2" data-testid="perf-ranges">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={range === r}
            onClick={() => {
              haptics.selection();
              setRange(r);
            }}
            className={`h-8 rounded-full px-3 text-xs transition-colors duration-200 ease-out ${
              range === r ? "bg-primary/12 font-semibold text-primary" : "text-muted-foreground"
            }`}
            data-testid={`perf-range-${r}`}
          >
            {r === "ALL" ? "All" : r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${listing.title} ${tab} chart, ${range}`}
        data-testid="perf-svg"
      >
        {/* quiet hairlines — no heavy grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
            y2={PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM)}
            stroke="currentColor"
            className="text-foreground/[0.06]"
            strokeWidth="1"
          />
        ))}

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
        {/* focal end-point dot */}
        <circle cx={x(points.length - 1)} cy={y(last)} r="6" fill={stroke} opacity="0.15" />
        <circle cx={x(points.length - 1)} cy={y(last)} r="3" fill={stroke} />

        {/* start / end value labels */}
        <text x={PAD_X} y={y(first) - 6} fontSize="10" fontFamily="'Geist Mono', monospace" fill="currentColor" className="text-muted-foreground">
          {formatValue(first)}
        </text>
        <text
          x={W - PAD_X}
          y={y(last) - 8}
          fontSize="10"
          fontWeight="600"
          textAnchor="end"
          fontFamily="'Geist Mono', monospace"
          fill={stroke}
          data-testid="perf-end-price"
        >
          {formatValue(last)}
        </text>

        {/* x-axis labels */}
        <text x={PAD_X} y={H - 6} fontSize="9" fontFamily="'Geist Mono', monospace" fill="currentColor" className="text-muted-foreground">
          {shortDate(points[0].at)}
        </text>
        <text x={W - PAD_X} y={H - 6} fontSize="9" textAnchor="end" fontFamily="'Geist Mono', monospace" fill="currentColor" className="text-muted-foreground">
          {shortDate(points[points.length - 1].at)}
        </text>
      </svg>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Simulated price history for illustration — not a promise of future returns.
      </p>
    </Block>
  );
}
