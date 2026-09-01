"use client";
// File responsibility: earnings chart (redesign). Minimal *static* 12-week bar chart — no range
// selector, no bar/line toggle (those trader-style controls were removed). Aggregate only.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { weeklyEarningsBuckets } from "@/lib/earnings-stats";
import type { EarningsEntry } from "@/types/earnings";
import { Block } from "@/components/common/Block";
import { weekLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Fixed calm window per the redesign brief. */
export const CHART_WEEKS = 12;

export function WeeklyEarningsChart({ entries }: { entries: EarningsEntry[] }) {
  const t = useTranslations("earnings");

  const buckets = useMemo(() => weeklyEarningsBuckets(entries, CHART_WEEKS), [entries]);
  const max = Math.max(1, ...buckets.map((b) => b.totalUsd));

  return (
    <section className="space-y-2" data-testid="earnings-chart-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("chartTitle")}
      </h2>
      <Block className="p-4" data-testid="earnings-chart">
        <div className="flex h-[88px] items-end gap-1.5">
          {buckets.map((b, i) => {
            const h = Math.max(b.totalUsd > 0 ? 8 : 2, Math.round((b.totalUsd / max) * 72));
            const empty = b.totalUsd === 0;
            return (
              <div key={`${b.weekOf}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-full max-w-[28px] rounded-t-[4px]",
                    empty
                      ? "bg-surface-2"
                      : b.hasPending && !b.hasPaid
                        ? "bg-warning/80"
                        : "bg-primary",
                  )}
                  style={{ height: h }}
                  data-testid="chart-bar"
                />
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex gap-1.5">
          {buckets.map((b, i) => (
            <div
              key={`lbl-${b.weekOf}-${i}`}
              className="min-w-0 flex-1 text-center text-[0.5625rem] leading-tight text-muted-foreground tnum"
            >
              {b.weekOf.startsWith("pad-") ? "—" : weekLabel(b.weekOf).replace(/ .*/, "")}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-center gap-4 border-t border-border pt-2" data-testid="chart-legend">
          <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" aria-hidden />
            {t("chartLegendPaid")}
          </span>
          <span className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <span className="size-2 rounded-full bg-warning/80" aria-hidden />
            {t("chartLegendProjected")}
          </span>
        </div>
        <p className="mt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("chartCaption")}
        </p>
      </Block>
    </section>
  );
}