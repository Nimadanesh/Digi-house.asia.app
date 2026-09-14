"use client";
// File responsibility: estate filter chips (All/Featured/New/Income/Owner Stay/Resale).
// Renders the left scroll half of the single marketplace control row: same ids, order
// and behavior as before, new 32px capsule visuals. Labels via `estates.chips.*`.
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
      className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden pe-3"
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
              "h-8 shrink-0 whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors duration-200 ease-out active:scale-[0.97]",
              active
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] text-[rgba(255,255,255,0.70)]",
            )}
          >
            {t(`chips.${id}`)}
          </button>
        );
      })}
    </div>
  );
}
