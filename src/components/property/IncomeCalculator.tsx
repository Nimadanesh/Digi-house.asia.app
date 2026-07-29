"use client";
// File responsibility: interactive "Your Income" calculator (Fable §Income calculator).
import { Minus, Plus } from "lucide-react";
import { usd, weeklyRent, projectedYield, annualFromWeekly } from "@/lib/format";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";

export function IncomeCalculator({
  listing,
  shares,
  onSharesChange,
}: {
  listing: Listing;
  shares: number;
  onSharesChange: (n: number) => void;
}) {
  const max = Math.max(1, listing.sharesRemaining > 0 ? listing.sharesRemaining : listing.totalShares);
  const clamped = Math.min(max, Math.max(1, shares));
  const week = projectedYield(weeklyRent(listing.annualRentUsd), clamped, listing.totalShares);
  const year = annualFromWeekly(week);

  function setShares(n: number) {
    haptics.selection();
    onSharesChange(n);
  }

  return (
    <Block className="p-4 space-y-3" data-testid="income-calculator">
      <h2 className="text-[0.9375rem] font-semibold text-foreground">Your Income</h2>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">Shares</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Decrease shares"
            disabled={clamped <= 1}
            onClick={() => setShares(Math.max(1, clamped - 1))}
            className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            <Minus size={18} strokeWidth={1.75} />
          </button>
          <span className="min-w-[48px] text-center text-lg font-semibold tnum" data-testid="income-shares">
            {clamped}
          </span>
          <button
            type="button"
            aria-label="Increase shares"
            disabled={clamped >= max}
            onClick={() => setShares(Math.min(max, clamped + 1))}
            className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            <Plus size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <input
        type="range"
        min={1}
        max={max}
        value={clamped}
        aria-label="Shares slider"
        onChange={(e) => setShares(Number(e.target.value))}
        className="w-full accent-primary h-2"
      />
      <p className="text-sm text-foreground leading-snug" data-testid="income-projection">
        With <span className="font-semibold tnum">{clamped}</span>{" "}
        {clamped === 1 ? "share" : "shares"}:{" "}
        <span className="text-success font-semibold tnum">{usd(week)}</span>
        /week ≈{" "}
        <span className="font-semibold tnum">{usd(year)}</span>
        /year
      </p>
    </Block>
  );
}
