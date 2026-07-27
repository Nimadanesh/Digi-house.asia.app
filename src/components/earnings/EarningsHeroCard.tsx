"use client";
// File responsibility: Earnings hero card (Fable Earnings §Main card).
// thisWeek amount is projected when Pending — not claimed as paid to wallet.
import { Block } from "@/components/common/Block";
import { StatusPill } from "@/components/common/StatusPill";
import { PayoutCountdown } from "@/components/earnings/PayoutCountdown";
import { usd } from "@/lib/format";
import type { EarningsSummary } from "@/types/earnings";
import { consecutivePaidWeeks, thisWeekStatus } from "@/lib/earnings-stats";

export function EarningsHeroCard({ summary }: { summary: EarningsSummary }) {
  const status = thisWeekStatus(summary.entries);
  const streak = consecutivePaidWeeks(summary.entries);
  const heroAmount = summary.thisWeekProjectedUsd;

  return (
    <Block className="p-4 space-y-4" data-testid="earnings-hero">
      <div className="text-center space-y-2">
        <p className="text-xs font-medium text-muted-foreground">This Week&apos;s Earnings</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <p
            className="text-[1.75rem] font-bold tracking-[-0.02em] tnum text-foreground leading-none"
            data-testid="earnings-hero-amount"
          >
            {usd(heroAmount)}
          </p>
          {status === "pending" ? (
            <StatusPill label="Pending" variant="warning" />
          ) : (
            <StatusPill label="Paid" variant="success" />
          )}
        </div>
        <div className="pt-1">
          <p className="text-[0.6875rem] text-muted-foreground mb-0.5">Next payout in</p>
          <PayoutCountdown variant="long" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
        <div className="text-center sm:text-left">
          <p className="text-[0.6875rem] text-muted-foreground">Total Earnings Received</p>
          <p className="mt-0.5 text-sm font-semibold tnum text-success" data-testid="earnings-all-time">
            {usd(summary.allTimeUsd)}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-[0.6875rem] text-muted-foreground">Consecutive Paid Weeks</p>
          <p className="mt-0.5 text-sm font-semibold text-foreground" data-testid="earnings-streak">
            {streak > 0 ? (
              <>
                <span className="tnum">{streak}</span> {streak === 1 ? "week" : "weeks"} in a row ✓
              </>
            ) : (
              "No streak yet"
            )}
          </p>
        </div>
      </div>
    </Block>
  );
}
