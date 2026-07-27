"use client";
// File responsibility: horizontal filter chips for marketplace (Fable §Header chips).
import { cn } from "@/lib/utils";
import {
  MARKETPLACE_CHIPS,
  type MarketplaceChip,
} from "@/lib/marketplace-filter";

export function MarketplaceFilterChips({
  value,
  onChange,
  onSelectHaptic,
}: {
  value: MarketplaceChip;
  onChange: (chip: MarketplaceChip) => void;
  onSelectHaptic?: () => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitOverflowScrolling: "touch" }}
      role="tablist"
      aria-label="Marketplace filters"
      data-testid="marketplace-filters"
    >
      {MARKETPLACE_CHIPS.map((chip) => {
        const active = chip.id === value;
        return (
          <button
            key={chip.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onSelectHaptic?.();
              onChange(chip.id);
            }}
            className={cn(
              "shrink-0 min-h-[36px] rounded-full px-3.5 text-sm font-medium transition-colors duration-200 ease-out active:scale-[0.97]",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-surface-2 text-foreground",
            )}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
