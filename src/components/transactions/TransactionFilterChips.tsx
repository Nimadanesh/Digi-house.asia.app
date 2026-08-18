"use client";
// File responsibility: horizontal kind-filter chips for the Transactions page.
import { cn } from "@/lib/utils";
import {
  TRANSACTION_CHIP_IDS,
  type TransactionChip,
} from "@/lib/transaction-filter";

const CHIP_LABELS: Record<TransactionChip, string> = {
  all: "All",
  buy: "Buy",
  instant_sell: "Instant sell",
  trade: "Trade",
  yield: "Yield",
  withdraw: "Withdraw",
};

export function TransactionFilterChips({
  value,
  onChange,
  onSelectHaptic,
}: {
  value: TransactionChip;
  onChange: (chip: TransactionChip) => void;
  onSelectHaptic?: () => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitOverflowScrolling: "touch" }}
      role="tablist"
      aria-label="Transaction filters"
      data-testid="transaction-filters"
    >
      {TRANSACTION_CHIP_IDS.map((id) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => {
              onSelectHaptic?.();
              onChange(id);
            }}
            className={cn(
              "shrink-0 min-h-[36px] rounded-full px-3.5 text-sm font-medium transition-colors duration-200 ease-out active:scale-[0.97]",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-surface-2 text-foreground",
            )}
          >
            {CHIP_LABELS[id]}
          </button>
        );
      })}
    </div>
  );
}
