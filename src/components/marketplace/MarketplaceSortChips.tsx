"use client";
// File responsibility: calm sort selector for estates (Phase 9 — default Curated, never
// highest yield; redesign §6 / UI Mapping §4.4). Quieter than filter chips: always
// surface-2 pills; the active one carries the azure text accent so the two rows don't
// compete for the primary pill style.
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ESTATE_SORT_IDS, type EstateSort } from "@/lib/marketplace-filter";

export function MarketplaceSortChips({
  value,
  onChange,
  onSelectHaptic,
}: {
  value: EstateSort;
  onChange: (sort: EstateSort) => void;
  onSelectHaptic?: () => void;
}) {
  const t = useTranslations("estates");

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitOverflowScrolling: "touch" }}
      role="group"
      aria-label={t("sortAria")}
      data-testid="estates-sort"
    >
      <span className="shrink-0 text-[0.6875rem] uppercase tracking-wide leading-tight text-muted-foreground">
        {t("sortLabel")}
      </span>
      {ESTATE_SORT_IDS.map((id) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              onSelectHaptic?.();
              onChange(id);
            }}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 min-h-[32px] rounded-full px-3 text-[0.8125rem] font-medium transition-colors duration-200 ease-out active:scale-[0.97]",
              active
                ? "bg-surface-2 text-primary"
                : "bg-surface-2 text-muted-foreground",
            )}
          >
            {active ? <Check size={13} strokeWidth={2.25} aria-hidden /> : null}
            {t(`sort.${id}`)}
          </button>
        );
      })}
    </div>
  );
}