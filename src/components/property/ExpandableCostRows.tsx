"use client";
// File responsibility: THE expandable cost-row list (Estate Page Structure §5.3,
// docs/design/ESTATE-PAGE-STRUCTURE.md) — Modeled-Costs rows inside one Block:
// each row (label + basis + value + chevron) expands independently to a detail
// paragraph and optional meta rows. Presentational only: labels, figures and
// formatting arrive via props (i18n at the call site); no engine/data imports,
// no internal copy. Row visual rules follow the FactRow system (DEC-014):
// ⓘ-free rows, tabular figures, values never wrap.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Block } from "@/components/common/Block";

export interface CostRowMeta {
  label: string;
  value: string;
}

export interface CostRowItem {
  id: string;
  label: string;
  /** Right-aligned figure — callers pass compact money so it never wraps. */
  value: string;
  /** Small basis line under the label (e.g. "5% of gross"). */
  basis?: string;
  /** Detail paragraph revealed on expand. */
  detail?: string | null;
  /** Optional bullet lines revealed on expand (TaskRows detail items). */
  bullets?: readonly string[];
  /** Optional extra label/value rows inside the detail body. */
  meta?: CostRowMeta[];
  /** Pending values render quieter than hard numbers. */
  valueMuted?: boolean;
}

export function ExpandableCostRows({
  rows,
  testId = "expandable-cost-rows",
}: {
  rows: readonly CostRowItem[];
  testId?: string;
}) {
  // Independent per-row expansion — costs explain themselves on demand.
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <Block className="overflow-hidden" data-testid={testId}>
      <div className="divide-y divide-border">
        {rows.map((row) => {
          const open = openIds.has(row.id);
          return (
            <div key={row.id} data-testid={`${testId}-item`}>
              <button
                type="button"
                onClick={() => toggle(row.id)}
                aria-expanded={open}
                aria-controls={`${testId}-${row.id}-detail`}
                className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-2 text-start transition-transform duration-[120ms] ease-out active:scale-[0.99]"
                data-testid={`${testId}-${row.id}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-muted-foreground">
                    {row.label}
                  </span>
                  {row.basis ? (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground/80">
                      {row.basis}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={cn(
                      "whitespace-nowrap text-sm tnum font-semibold",
                      row.valueMuted ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {row.value}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden
                    className={cn(
                      "text-muted-foreground transition-transform duration-200 ease-out",
                      open ? "rotate-180" : "",
                    )}
                  />
                </span>
              </button>
              {open ? (
                <div
                  id={`${testId}-${row.id}-detail`}
                  className="px-4 pb-3"
                  data-testid={`${testId}-${row.id}-detail`}
                >
                  {row.detail ? (
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {row.detail}
                    </p>
                  ) : null}
                  {row.bullets && row.bullets.length > 0 ? (
                    <ul className={cn("space-y-1", row.detail && "pt-1.5")}>
                      {row.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"
                        >
                          <span aria-hidden className="mt-[0.45em] shrink-0 text-muted-foreground/60">
                            •
                          </span>
                          <span className="min-w-0">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {row.meta && row.meta.length > 0 ? (
                    <div className={cn("space-y-1", row.detail && "pt-1.5")}>
                      {row.meta.map((m) => (
                        <div
                          key={m.label}
                          className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2"
                        >
                          <span className="min-w-0 truncate text-xs text-muted-foreground">
                            {m.label}
                          </span>
                          <span className="shrink-0 whitespace-nowrap text-xs tnum font-medium text-foreground">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Block>
  );
}
