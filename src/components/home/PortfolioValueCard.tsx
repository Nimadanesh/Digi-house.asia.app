"use client";
// File responsibility: Home portfolio value hero card (Fable Home §Portfolio Value).
import Link from "next/link";
import { usd, ton, estimateNanoTon, pct } from "@/lib/format";
import { ROUTES, TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { PortfolioSummary } from "@/types/position";
import { Block } from "@/components/common/Block";
import { cn } from "@/lib/utils";

export function PortfolioValueCard({
  summary,
  onNavigateHaptic,
}: {
  summary: PortfolioSummary;
  onNavigateHaptic?: () => void;
}) {
  const change = summary.dayChangeRatio;
  const up = change >= 0;

  return (
    <Link
      href={ROUTES.portfolio}
      onClick={() => onNavigateHaptic?.()}
      className="block active:scale-[0.99] transition-transform duration-[120ms] ease-out"
      data-testid="portfolio-value-card"
    >
      <Block className="p-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Portfolio Value</p>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[1.75rem] font-bold tracking-[-0.02em] tnum text-foreground leading-none">
              {usd(summary.totalValueUsd)}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground tnum">
              ≈ {ton(estimateNanoTon(summary.totalValueUsd, TON_PRICE_USD_CENTS))}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tnum",
              up ? "bg-success/12 text-success" : "bg-danger/12 text-danger",
            )}
            data-testid="day-change-badge"
          >
            {up ? "+" : "−"}
            {pct(Math.abs(change))}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
          <div>
            <p className="text-[0.6875rem] text-muted-foreground">Total Invested</p>
            <p className="mt-0.5 text-sm font-semibold tnum text-foreground">{usd(summary.totalInvestedUsd)}</p>
          </div>
          <div>
            <p className="text-[0.6875rem] text-muted-foreground">Total Earnings Received</p>
            <p className="mt-0.5 text-sm font-semibold tnum text-success">{usd(summary.totalEarningsUsd)}</p>
          </div>
        </div>
      </Block>
    </Link>
  );
}
