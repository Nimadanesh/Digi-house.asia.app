"use client";
// File responsibility: USD / TON segmented control for Settings display currency.
import type { DisplayCurrency } from "@/stores/settings.store";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";

export function CurrencySegment({
  value,
  onChange,
}: {
  value: DisplayCurrency;
  onChange: (c: DisplayCurrency) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Display currency"
      className="inline-flex h-9 shrink-0 rounded-[10px] bg-surface-2 p-0.5"
      data-testid="currency-segment"
    >
      {(["usd", "ton"] as const).map((c) => {
        const selected = value === c;
        const label = c === "usd" ? "USD" : "TON";
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            onClick={() => {
              haptics.selection();
              onChange(c);
            }}
            className={cn(
              "min-w-[44px] rounded-[8px] px-3 text-[0.8125rem] font-semibold transition-colors duration-200 ease-out active:scale-[0.97]",
              selected ? "bg-card text-foreground" : "text-muted-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
