"use client";
// File responsibility: horizontal estate filter chips (Phase 9 — All/Featured/New/Income/
// Owner Stay/Resale per redesign §6 / UI Mapping §4.3). Labels via `estates.chips.*`.
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ESTATE_FILTER_IDS, type EstateFilter } from "@/lib/marketplace-filter";

export function MarketplaceFilterChips({
  value,
  onChange,
  onSelectHaptic,
}: {
  value: EstateFilter;
  onChange: (filter: EstateFilter) => void;
  onSelectHaptic?: () => void;
}) {
  const t = useTranslations("estates");

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-0.5 -mx-4 px-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      style={{ WebkitOverflowScrolling: "touch" }}
      role="tablist"
      aria-label={t("filtersAria")}
      data-testid="estates-filters"
    >
      {ESTATE_FILTER_IDS.map((id) => {
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
            {t(`chips.${id}`)}
          </button>
        );
      })}
    </div>
  );
}