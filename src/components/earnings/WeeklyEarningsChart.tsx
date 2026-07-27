"use client";
// File responsibility: earnings chart with week-range selector + bar/line visualizations.
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { weeklyEarningsBuckets } from "@/lib/earnings-stats";
import type { EarningsEntry } from "@/types/earnings";
import { Block } from "@/components/common/Block";
import { weekLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/hooks/useTelegram";

const RANGES = [1, 2, 3, 4, 8, 12] as const;
export type ChartWeekRange = (typeof RANGES)[number];
type ChartMode = "bar" | "line";

export function WeeklyEarningsChart({ entries }: { entries: EarningsEntry[] }) {
  const { haptics } = useTelegram();
  const [weeks, setWeeks] = useState<ChartWeekRange>(8);
  const [mode, setMode] = useState<ChartMode>("bar");
  const [menuOpen, setMenuOpen] = useState(false);

  const buckets = useMemo(() => weeklyEarningsBuckets(entries, weeks), [entries, weeks]);
  const max = Math.max(1, ...buckets.map((b) => b.totalUsd));

  return (
    <section className="space-y-2" data-testid="earnings-chart-section">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="relative">
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1 text-[0.9375rem] font-semibold text-foreground"
            aria-expanded={menuOpen}
            data-testid="chart-range-trigger"
            onClick={() => {
              haptics.selection();
              setMenuOpen((v) => !v);
            }}
          >
            Last {weeks} weeks
            <ChevronDown
              size={18}
              strokeWidth={1.75}
              className={cn("text-muted-foreground transition-transform", menuOpen && "rotate-180")}
            />
          </button>
          {menuOpen ? (
            <div
              className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-[12px] border border-border bg-card py-1"
              role="listbox"
              data-testid="chart-range-menu"
            >
              {RANGES.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="option"
                  aria-selected={n === weeks}
                  className={cn(
                    "flex w-full min-h-[40px] items-center px-3 text-left text-sm",
                    n === weeks ? "bg-primary/10 font-semibold text-primary" : "text-foreground",
                  )}
                  onClick={() => {
                    haptics.selection();
                    setWeeks(n);
                    setMenuOpen(false);
                  }}
                >
                  {n} week{n === 1 ? "" : "s"}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="inline-flex rounded-[10px] bg-surface-2 p-0.5" role="group" aria-label="Chart type">
          {(["bar", "line"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                haptics.selection();
                setMode(m);
              }}
              className={cn(
                "min-h-[32px] rounded-[8px] px-2.5 text-xs font-semibold capitalize",
                mode === m ? "bg-card text-foreground" : "text-muted-foreground",
              )}
              data-testid={`chart-mode-${m}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <Block className="p-4" data-testid="earnings-chart">
        {mode === "bar" ? (
          <BarChart buckets={buckets} max={max} />
        ) : (
          <LineChart buckets={buckets} max={max} />
        )}
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
      </Block>
    </section>
  );
}

function BarChart({
  buckets,
  max,
}: {
  buckets: ReturnType<typeof weeklyEarningsBuckets>;
  max: number;
}) {
  return (
    <div className="flex h-[88px] items-end gap-1.5">
      {buckets.map((b, i) => {
        const h = Math.max(b.totalUsd > 0 ? 8 : 2, Math.round((b.totalUsd / max) * 72));
        const empty = b.totalUsd === 0;
        return (
          <div key={`${b.weekOf}-${i}`} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "w-full max-w-[28px] rounded-t-[4px] transition-[height] duration-300 ease-out",
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
  );
}

function LineChart({
  buckets,
  max,
}: {
  buckets: ReturnType<typeof weeklyEarningsBuckets>;
  max: number;
}) {
  const w = 280;
  const h = 88;
  const pad = 6;
  const pts = buckets.map((b, i) => {
    const x = pad + (i / Math.max(1, buckets.length - 1)) * (w - pad * 2);
    const y = h - pad - (b.totalUsd / max) * (h - pad * 2);
    return `${x},${y}`;
  });
  const d = pts.length ? `M ${pts.join(" L ")}` : "";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[88px] w-full" data-testid="chart-line" aria-hidden>
      <path d={d} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" />
      {buckets.map((b, i) => {
        const x = pad + (i / Math.max(1, buckets.length - 1)) * (w - pad * 2);
        const y = h - pad - (b.totalUsd / max) * (h - pad * 2);
        return <circle key={b.weekOf + i} cx={x} cy={y} r="3.5" fill="var(--color-primary)" />;
      })}
    </svg>
  );
}
