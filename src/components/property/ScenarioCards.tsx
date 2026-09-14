"use client";
// File responsibility: THE scenario-selection card set (Estate Page Structure
// §5.2, docs/design/ESTATE-PAGE-STRUCTURE.md) — four selectable scenario cards
// (Conservative / Base / Optimistic / Average); the selected card expands to its
// detail rows while the others stay collapsed with their headline figure.
// Presentational only: labels, figures and formatting arrive via props (i18n at
// the call site); selection is controlled by the caller so the default (Base)
// and any cross-section consistency are owned by the page. No engine/data
// imports, no internal copy.
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Block } from "@/components/common/Block";

export interface ScenarioCardRow {
  label: string;
  /** Rendered value — callers pass compact money so it never wraps. */
  value: string;
  /** Pending values render quieter than hard numbers. */
  valueMuted?: boolean;
  /** Contract-highlighted rows (per-share figures) render in the accent color. */
  emphasized?: boolean;
  testId?: string;
}

export interface ScenarioCardItem {
  key: string;
  label: string;
  /** Headline shown on the collapsed card (e.g. per-share annual, Projected). */
  headline: string;
  /** Basis line under the headline (e.g. "220 modeled nights"). */
  headlineNote?: string;
  /** Detail rows revealed when the card is selected. */
  rows: ScenarioCardRow[];
}

export function ScenarioCards({
  items,
  selectedKey,
  onSelect,
  testId = "scenario-cards",
}: {
  items: readonly ScenarioCardItem[];
  /** Key of the expanded card (caller-owned state; Base by default). */
  selectedKey: string;
  onSelect: (key: string) => void;
  testId?: string;
}) {
  return (
    <div className="space-y-2" data-testid={testId}>
      {items.map((item) => {
        const selected = item.key === selectedKey;
        return (
          <Block
            key={item.key}
            className={cn(
              "overflow-hidden transition-colors duration-150 ease-out",
              selected ? "border border-primary" : "border border-transparent",
            )}
          >
            <button
              type="button"
              onClick={() => onSelect(item.key)}
              aria-expanded={selected}
              aria-controls={`${testId}-${item.key}-detail`}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-2.5 text-start transition-transform duration-[120ms] ease-out active:scale-[0.99]"
              data-testid={`${testId}-${item.key}`}
            >
              <span className="min-w-0">
                <span
                  className={cn(
                    "block truncate text-sm font-semibold",
                    selected ? "text-primary" : "text-foreground",
                  )}
                >
                  {item.label}
                </span>
                {item.headlineNote ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {item.headlineNote}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="whitespace-nowrap text-sm tnum font-semibold text-foreground">
                  {item.headline}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden
                  className={cn(
                    "text-muted-foreground transition-transform duration-200 ease-out",
                    selected ? "rotate-180" : "",
                  )}
                />
              </span>
            </button>
            {selected ? (
              <div
                id={`${testId}-${item.key}-detail`}
                className="border-t border-border px-4 py-1"
                data-testid={`${testId}-${item.key}-detail`}
              >
                {item.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 py-1.5"
                    data-testid={row.testId}
                  >
                    <span className="min-w-0 truncate text-sm text-muted-foreground">
                      {row.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 whitespace-nowrap text-sm tnum font-semibold",
                        row.emphasized && "text-primary",
                        row.valueMuted
                          ? "text-muted-foreground"
                          : row.emphasized
                            ? ""
                            : "text-foreground",
                      )}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </Block>
        );
      })}
    </div>
  );
}
