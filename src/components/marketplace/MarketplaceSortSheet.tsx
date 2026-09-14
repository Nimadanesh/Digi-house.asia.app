"use client";
// File responsibility: marketplace sort sheet — the existing sort enum in its existing
// order (Curated/Rental income/Entry price/Newest/Estate value), radio rows with a
// checkmark on the current sort. Display only; selection goes through onChange.
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";
import { ESTATE_SORT_IDS, type EstateSort } from "@/lib/marketplace-filter";
import { cn } from "@/lib/utils";

export function MarketplaceSortSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: EstateSort;
  onChange: (sort: EstateSort) => void;
}) {
  const t = useTranslations("estates");

  return (
    <Sheet open={open} onClose={onClose} labelledBy="marketplace-sort-title">
      <div className="space-y-3 pb-3" data-testid="sort-sheet">
        <h2
          id="marketplace-sort-title"
          className="text-[1.0625rem] font-semibold leading-snug text-foreground"
        >
          {t("sortLabel")}
        </h2>
        <Block className="px-4 py-1" role="radiogroup" aria-label={t("sortAria")}>
          {ESTATE_SORT_IDS.map((id) => {
            const active = id === value;
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`sort-option-${id}`}
                onClick={() => {
                  haptics.selection();
                  onChange(id);
                  onClose();
                }}
                className="flex min-h-[48px] w-full items-center justify-between gap-3 border-t border-border py-2.5 text-left first:border-t-0"
              >
                <span
                  className={cn(
                    "text-sm leading-snug",
                    active ? "font-semibold text-primary" : "text-foreground",
                  )}
                >
                  {t(`sort.${id}`)}
                </span>
                {active ? (
                  <Check size={18} strokeWidth={2.25} aria-hidden className="shrink-0 text-primary" />
                ) : null}
              </button>
            );
          })}
        </Block>
      </div>
    </Sheet>
  );
}
