"use client";
// File responsibility: THE read-only icon-point grid (Estate Page Structure §4.1
// highlights and §4.3 amenities, docs/design/ESTATE-PAGE-STRUCTURE.md) — icon +
// label cells in a grid (2 columns mobile / 3 when the caller widens it).
// Presentational only: labels and icons arrive via props (i18n and icon mapping
// at the call site); no engine/data imports, no internal copy, no interaction.
import { cn } from "@/lib/utils";

export interface IconPoint {
  id: string;
  label: string;
  /** Lucide icon node from the caller; renders muted when provided. */
  icon?: React.ReactNode;
}

export function IconPointsGrid({
  points,
  columns = 2,
  smColumns,
  truncateLabels = true,
  testId = "icon-points-grid",
}: {
  points: readonly IconPoint[];
  /** Exact column count for the 480px canvas (2 default; 3 for wider grids). */
  columns?: 2 | 3;
  /** Optional wider column count from the sm breakpoint up (e.g. 3). */
  smColumns?: 3;
  /** Amenities render full labels (wrap); compact grids may truncate. */
  truncateLabels?: boolean;
  testId?: string;
}) {
  if (points.length === 0) return null;
  return (
    <div
      className={cn(
        "grid w-full min-w-0 gap-x-4 gap-y-3",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
        smColumns === 3 && "sm:grid-cols-3",
      )}
      data-testid={testId}
    >
      {points.map((point) => (
        <div
          key={point.id}
          className="flex min-w-0 items-start gap-2 overflow-hidden"
          data-testid={`${testId}-point`}
        >
          {point.icon ? (
            <span className="shrink-0 text-muted-foreground [&>svg]:block" aria-hidden>
              {point.icon}
            </span>
          ) : null}
          <span
            className={cn(
              "min-w-0 break-words text-sm text-foreground",
              truncateLabels && "truncate",
              !truncateLabels && "leading-snug [overflow-wrap:anywhere]",
            )}
          >
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}
