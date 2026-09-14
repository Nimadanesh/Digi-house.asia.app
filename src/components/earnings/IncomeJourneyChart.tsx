"use client";
// File responsibility: Slice I income journey — the time dimension of income.
// Paid bars (primary) + projected bars (muted future) per week with a cumulative
// received line; tapping a column opens a compact detail panel (date, paid,
// projected, distributions, contributing estates with drill-down links, current
// accrued). Ranges clamp honestly to available history. All series keep their
// economic meaning; pads render faint and explain themselves.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { usd, weekLabel } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import type { EstateDisplayIdentity } from "@/lib/economics/estates/estate-display-identity";
import type { EarningsEntry } from "@/types/earnings";
import {
  applyRange,
  availableRanges,
  buildTimelinePoints,
  cumulativePaid,
  type TimelineRange,
} from "@/lib/income-chart-model";

const RANGE_KEYS: Record<TimelineRange, string> = {
  "12W": "range12w",
  "6M": "range6m",
  "1Y": "range1y",
  ALL: "rangeAll",
};

export function IncomeJourneyChart({
  entries,
  propertyById,
  accruedUsd,
}: {
  entries: EarningsEntry[];
  /** Canonical estate names for the detail drill-down; unknown ids fall back to the id. */
  propertyById: Map<string, Pick<EstateDisplayIdentity, "name">>;
  /** Current accrued total (labeled to-date, never weekly). */
  accruedUsd?: number;
}) {
  const t = useTranslations("earnings");
  const points = useMemo(() => buildTimelinePoints(entries), [entries]);
  const ranges = useMemo(() => availableRanges(points.length), [points.length]);
  const [range, setRange] = useState<TimelineRange>("12W");
  const view = useMemo(() => applyRange(points, range), [points, range]);
  const cum = useMemo(() => cumulativePaid(view.weeks), [view]);

  // Latest week with ledger data — the meaningful first paint.
  const defaultIndex = useMemo(() => {
    for (let i = view.weeks.length - 1; i >= 0; i--) {
      if (!view.weeks[i].empty) return i;
    }
    return 0;
  }, [view]);
  const [selected, setSelected] = useState<number | null>(null);
  const active = selected ?? defaultIndex;
  const point = view.weeks[active];

  const maxBar = Math.max(1, ...view.weeks.map((w) => (w.paidUsd ?? 0) + (w.projectedUsd ?? 0)));
  const maxCum = Math.max(1, ...cum);
  const line = cum
    .map((v, i) => `${((i + 0.5) / cum.length) * 100},${92 - (v / maxCum) * 84}`)
    .join(" ");

  return (
    <section className="space-y-2" data-testid="income-journey">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("journeyTitle")}</h2>
        <div className="flex gap-1" role="group" aria-label={t("journeyTitle")} data-testid="journey-ranges">
          {ranges.map((r) => {
            const on = range === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  haptics.selection();
                  setRange(r);
                  setSelected(null);
                }}
                data-testid={`journey-range-${r}`}
                className={`min-h-[32px] min-w-[44px] rounded-full px-2.5 text-xs font-semibold transition-colors duration-[120ms] ease-out ${
                  on ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                {t(RANGE_KEYS[r])}
              </button>
            );
          })}
        </div>
      </div>

      <Block className="p-4" data-testid="income-journey-chart">
        <div className="relative">
          <div className="flex h-[148px] items-end gap-1.5">
            {view.weeks.map((w, i) => {
              const total = (w.paidUsd ?? 0) + (w.projectedUsd ?? 0);
              const h = total > 0 ? Math.max(10, Math.round((total / maxBar) * 120)) : 4;
              const paidH = total > 0 ? Math.round(((w.paidUsd ?? 0) / total) * h) : 0;
              const isActive = i === active;
              return (
                <button
                  key={w.empty ? `pad-${i}` : `${w.weekOf}-${i}`}
                  type="button"
                  data-testid="journey-bar"
                  aria-pressed={isActive}
                  aria-label={barLabel(t, w.weekOf, w.paidUsd, w.projectedUsd, w.empty)}
                  onClick={() => {
                    haptics.selection();
                    setSelected(i);
                  }}
                  className="flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-end rounded-[6px] transition-colors duration-[120ms] ease-out"
                >
                  <span
                    className={`flex w-full max-w-[28px] flex-col justify-end overflow-hidden rounded-t-[4px] ${
                      isActive ? "ring-1 ring-primary" : ""
                    }`}
                    style={{ height: h }}
                    aria-hidden
                  >
                    {(w.projectedUsd ?? 0) > 0 ? (
                      <span className="w-full bg-warning/80" style={{ height: h - paidH }} />
                    ) : null}
                    {paidH > 0 ? <span className="w-full bg-primary" style={{ height: paidH }} /> : null}
                    {total === 0 ? <span className="w-full bg-surface-2" style={{ height: h }} /> : null}
                  </span>
                </button>
              );
            })}
          </div>
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 h-[148px] w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              className="text-success/70"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="mt-2 flex gap-1.5">
          {view.weeks.map((w, i) => (
            <div
              key={`lbl-${w.empty ? `pad-${i}` : `${w.weekOf}-${i}`}`}
              className="min-w-0 flex-1 text-center text-[0.5625rem] leading-tight text-muted-foreground tnum"
              aria-hidden
            >
              {w.empty ? "—" : weekLabel(w.weekOf).replace(/ .*/, "")}
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-border pt-2" data-testid="journey-legend">
          <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            {t("chartLegendPaid")}
          </span>
          <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="size-2 rounded-full bg-warning/80" aria-hidden />
            {t("chartLegendProjected")}
          </span>
          <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="inline-block h-0 w-4 border-t-2 border-success/70" aria-hidden />
            {t("journeyTotal")}
          </span>
        </div>
        {view.constrained && range !== "ALL" ? (
          <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="journey-range-note">
            {t("rangeConstrained", { count: points.length })}
          </p>
        ) : null}
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("chartCaption")}
        </p>
      </Block>

      <Block className="p-4" data-testid="journey-detail" aria-live="polite">
        {point == null || point.empty ? (
          <p className="text-sm text-muted-foreground">{t("detailNoData")}</p>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-foreground tnum">
              {point.weekOf ? weekLabel(point.weekOf) : "—"}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("timelinePaid")}</span>
              <span className="tnum font-semibold text-success">
                {point.paidUsd != null ? usd(point.paidUsd) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("chartLegendProjected")}</span>
              <span className="tnum font-semibold text-foreground">
                {point.projectedUsd != null ? usd(point.projectedUsd) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("detailDistsLabel")}</span>
              <span className="tnum font-semibold text-foreground">{point.distributionCount}</span>
            </div>
            {accruedUsd !== undefined ? (
              <div className="flex justify-between border-t border-border pt-2 text-sm">
                <span className="text-muted-foreground">{t("detailAccruedNow")}</span>
                <span className="tnum font-semibold text-foreground">{usd(accruedUsd)}</span>
              </div>
            ) : null}
            {point.estateIds.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 border-t border-border pt-2.5">
                {point.estateIds.map((id) => (
                  <Link
                    key={id}
                    href={`/property/${id}`}
                    onClick={() => haptics.selection()}
                    className="rounded-full bg-surface-2 px-3 py-1.5 text-xs font-medium text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
                  >
                    {propertyById.get(id)?.name ?? id}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Block>
    </section>
  );
}

function barLabel(
  t: (key: string) => string,
  weekOf: string,
  paidUsd: number | null,
  projectedUsd: number | null,
  empty: boolean,
): string {
  if (empty) return t("detailNoData");
  const parts = [weekOf ? weekLabel(weekOf) : ""];
  parts.push(`${t("timelinePaid")}: ${paidUsd != null ? usd(paidUsd) : "—"}`);
  parts.push(`${t("chartLegendProjected")}: ${projectedUsd != null ? usd(projectedUsd) : "—"}`);
  return parts.join(", ");
}
