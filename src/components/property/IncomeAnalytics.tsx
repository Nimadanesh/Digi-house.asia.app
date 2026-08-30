"use client";
// File responsibility: Income Analytics tab composition (REDESIGN-SPEC §13 /
// Phase 7) — income history chart (monthly per-share bars + cumulative yield
// line) from the Phase 4 shared incomeHistory dataset, payout history list,
// real-estate ratio stats from shared metrics, and a projections pointer to
// the existing Overview calculator. No new financial math; no chart-local
// random data; no revenue-breakdown fabrication (dataset carries no such
// fields — spec: do not invent categories merely to fill space).
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { getPropertyAnalytics, type IncomePoint } from "@/lib/property-analytics";
import { usd } from "@/lib/format";
import { Block } from "@/components/common/Block";
import {
  CHART_W,
  CHART_H,
  PAD_X,
  PAD_TOP,
  PAD_BOTTOM,
  GridLines,
  DateLabels,
  HitZones,
  useHitZones,
  shortDate,
} from "./charts/shared";

const HISTORY_MONTHS = 12;

/** Monthly bars + cumulative line share one x scale over the income months. */
function useIncomeScales(points: IncomePoint[]) {
  return useMemo(() => {
    const step = (CHART_W - 2 * PAD_X) / Math.max(1, points.length);
    const x = (i: number) => PAD_X + i * step;
    const cumulative: number[] = [];
    let acc = 0;
    for (const p of points) {
      acc += p.perShareUsd;
      cumulative.push(acc);
    }
    const maxBar = Math.max(...points.map((p) => p.perShareUsd), 1);
    const maxCum = Math.max(...cumulative, 1);
    const barY = (v: number) =>
      PAD_TOP + (1 - v / maxBar) * (CHART_H - PAD_TOP - PAD_BOTTOM);
    const cumY = (v: number) =>
      PAD_TOP + (1 - v / maxCum) * (CHART_H - PAD_TOP - PAD_BOTTOM);
    return { x, step, cumulative, maxBar, maxCum, barY, cumY };
  }, [points]);
}

function monthShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, 1)).toLocaleDateString(undefined, {
    month: "short",
  });
}

export function IncomeAnalytics({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const [sel, setSel] = useState<number | null>(null);

  const analytics = useMemo(() => getPropertyAnalytics(listing), [listing]);
  const income = analytics.incomeHistory;
  const points = income.slice(Math.max(0, income.length - HISTORY_MONTHS));
  const { x, step, cumulative, barY, cumY } = useIncomeScales(points);

  const xs = useHitZones(points.length);
  const selPoint = sel != null ? points[sel] : null;

  const metrics = analytics.metrics;
  const lastCum = cumulative[cumulative.length - 1] ?? 0;

  const barW = Math.max(2, step * 0.55);
  const cumPath = cumulative
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${cumY(v).toFixed(1)}`)
    .join(" ");

  return (
    <div className="space-y-5" data-testid="income-analytics">
      {/* ── §13 Main chart: monthly bars + cumulative line ── */}
      <Block className="space-y-3 p-4" data-testid="income-chart">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("incomeHistoryTitle")}
        </h3>
        <svg
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          className="w-full"
          role="img"
          aria-label={t("incomeHistoryTitle")}
          aria-describedby="income-chart-summary"
          data-testid="income-svg"
        >
          <GridLines />
          {/* Monthly per-share payout bars */}
          {points.map((p, i) => (
            <rect
              key={p.month}
              x={x(i) - barW / 2}
              y={barY(p.perShareUsd)}
              width={barW}
              height={Math.max(1, CHART_H - PAD_BOTTOM - barY(p.perShareUsd))}
              fill="var(--color-primary)"
              fillOpacity={sel === null || sel === i ? 0.55 : 0.25}
              data-testid={`income-bar-${i}`}
            />
          ))}
          {/* Cumulative yield line (right-scaled) */}
          <path
            d={cumPath}
            fill="none"
            stroke="var(--color-success, #3fb950)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-testid="income-cumulative-line"
          />
          <HitZones xs={xs} onIndex={setSel} />
          <DateLabels
            firstAt={points[0]?.paidAt ?? ""}
            lastAt={points[points.length - 1]?.paidAt ?? ""}
          />
        </svg>
        {/* Screen-reader summary: total paid per share over the window. */}
        <p id="income-chart-summary" className="sr-only">
          {t("cumulativeYieldPerShare")}: {usd(lastCum)} · {points.length} {t("incomeMonthsWord")}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span data-testid="income-months-label">
            {points.length} {t("incomeMonthsWord")}
          </span>
          <span className="tnum" data-testid="income-cumulative-total">
            {t("cumulativeYieldPerShare")}: {usd(lastCum)}
          </span>
        </div>
        {/* Tap tooltip (touch-first, no hover dependency) */}
        <div
          className="min-h-[3.25rem] rounded-[10px] bg-surface-2 px-3 py-2 text-center text-xs leading-relaxed text-foreground"
          data-testid="income-tooltip"
        >
          {selPoint ? (
            <>
              <span className="font-semibold">{monthShort(selPoint.month)}</span>
              {" · "}
              <span className="tnum">{usd(selPoint.perShareUsd)}</span>
              {t("perShareWord")} · {t("poolWord")}{" "}
              <span className="tnum">{usd(selPoint.poolUsd)}</span>
            </>
          ) : (
            t("incomeTapHint")
          )}
        </div>
      </Block>

      {/* ── §13 Payout history list ── */}
      <Block className="space-y-3 p-4" data-testid="payout-history">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("payoutHistoryTitle")}
        </h3>
        <div className="flex flex-col">
          {[...points].reverse().map((p, idx) => (
            <div
              key={p.month}
              className={`flex items-center justify-between gap-2 py-2 text-xs ${
                idx > 0 ? "border-t border-foreground/[0.06]" : ""
              }`}
              data-testid={`payout-row-${p.month}`}
            >
              <span className="text-muted-foreground tnum">{p.month}</span>
              <span className="text-muted-foreground">{shortDate(p.paidAt)}</span>
              <span className="font-medium text-foreground tnum">
                {usd(p.perShareUsd)}
              </span>
              <span className="text-muted-foreground tnum">{usd(p.poolUsd)}</span>
            </div>
          ))}
        </div>
        <p className="px-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("payoutHistoryNote")}
        </p>
      </Block>

      {/* ── §13 Real-estate ratios — shared metrics only ── */}
      <Block className="space-y-3 p-4" data-testid="income-ratios">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("incomeRatiosTitle")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-[10px] bg-surface-2 px-3 py-2 text-center">
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
              {t("grossYield")}
            </p>
            <p className="text-[1.125rem] font-bold leading-tight text-foreground tnum">
              {(metrics.grossYieldRatio * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-[10px] bg-surface-2 px-3 py-2 text-center">
            <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
              {t("annualYieldRate")}
            </p>
            <p className="text-[1.125rem] font-bold leading-tight text-foreground tnum">
              {metrics.annualYieldRatePct.toFixed(1)}%
            </p>
          </div>
        </div>
        <p className="px-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("incomeRatiosNote")}
        </p>
      </Block>

      {/* ── §13 Projections — the calculator already lives on Overview ── */}
      <Block className="space-y-2 p-4" data-testid="income-projections">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("incomeProjectionsTitle")}
        </h3>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t("incomeProjectionsNote")}
        </p>
      </Block>
    </div>
  );
}
