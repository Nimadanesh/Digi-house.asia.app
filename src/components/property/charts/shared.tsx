"use client";
// File responsibility: shared SVG chart primitives for the Property redesign
// (REDESIGN-SPEC Phase 5). All series come from lib/property-analytics (Phase 4
// shared deterministic datasets) — no chart-local random series. Mobile-first:
// full-width viewBox scaling, touch-friendly tap targets, token-only colors.
import { useMemo } from "react";
import { cn } from "@/lib/utils";

// viewBox space — scales to container width (≤480px), fixed aspect.
export const CHART_W = 440;
export const CHART_H = 200;
export const PAD_X = 8;
export const PAD_TOP = 16;
export const PAD_BOTTOM = 24;

export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Categorical palette for holder charts: a calm ramp of the ONE Telegram-blue
 * accent (DESIGN_SYSTEM one-accent rule) — bucket 0 is strongest, later buckets
 * fade; "Others" is muted gray, never a second accent.
 */
export const HOLDER_COLORS = [
  { fill: "var(--color-primary)", fillOpacity: 1 },
  { fill: "var(--color-primary)", fillOpacity: 0.78 },
  { fill: "var(--color-primary)", fillOpacity: 0.6 },
  { fill: "var(--color-primary)", fillOpacity: 0.44 },
  { fill: "var(--color-primary)", fillOpacity: 0.3 },
];
export const OTHERS_COLOR = { fill: "var(--color-muted-foreground)", fillOpacity: 0.4 };

/** Build a line path + closed area path over a numeric series (scaled to viewBox). */
export function buildPaths(values: number[]): {
  linePath: string;
  areaPath: string;
  min: number;
  max: number;
  x: (i: number) => number;
  y: (v: number) => number;
} {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || max || 1;
  const x = (i: number) => PAD_X + (i * (CHART_W - 2 * PAD_X)) / (values.length - 1);
  const y = (v: number) => PAD_TOP + (1 - (v - min) / span) * (CHART_H - PAD_TOP - PAD_BOTTOM);
  const linePath = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${x(values.length - 1).toFixed(1)} ${CHART_H - PAD_BOTTOM} L ${PAD_X} ${CHART_H - PAD_BOTTOM} Z`;
  return { linePath, areaPath, min, max, x, y };
}

/** Quiet hairline gridlines — no heavy grid (DESIGN_SYSTEM flat rule). */
export function GridLines() {
  return (
    <>
      {[0.25, 0.5, 0.75].map((f) => (
        <line
          key={f}
          x1={PAD_X}
          x2={CHART_W - PAD_X}
          y1={PAD_TOP + f * (CHART_H - PAD_TOP - PAD_BOTTOM)}
          y2={PAD_TOP + f * (CHART_H - PAD_TOP - PAD_BOTTOM)}
          stroke="currentColor"
          className="text-foreground/[0.06]"
          strokeWidth="1"
        />
      ))}
    </>
  );
}

/** X-axis start/end date labels (mono, muted). */
export function DateLabels({ firstAt, lastAt }: { firstAt: string; lastAt: string }) {
  return (
    <>
      <text
        x={PAD_X}
        y={CHART_H - 6}
        fontSize="9"
        fontFamily="'Geist Mono', monospace"
        fill="currentColor"
        className="text-muted-foreground"
      >
        {shortDate(firstAt)}
      </text>
      <text
        x={CHART_W - PAD_X}
        y={CHART_H - 6}
        fontSize="9"
        textAnchor="end"
        fontFamily="'Geist Mono', monospace"
        fill="currentColor"
        className="text-muted-foreground"
      >
        {shortDate(lastAt)}
      </text>
    </>
  );
}

/**
 * Touch-friendly chart surface: invisible vertical hit zones over the plot area.
 * Reports the hovered index so charts can render their own tooltip. Mobile-first
 * — every zone is a full-height tap target, no hover dependency (spec §22).
 */
export function useHitZones(count: number) {
  return useMemo(() => {
    const step = (CHART_W - 2 * PAD_X) / Math.max(1, count - 1);
    return Array.from({ length: count }, (_, i) => PAD_X + i * step);
  }, [count]);
}

export function HitZones({
  xs,
  onIndex,
}: {
  xs: number[];
  onIndex: (i: number | null) => void;
}) {
  const half = xs.length > 1 ? (xs[1] - xs[0]) / 2 : CHART_W / 2;
  return (
    <>
      {xs.map((cx, i) => (
        <rect
          key={i}
          x={cx - half}
          y={0}
          width={half * 2}
          height={CHART_H}
          fill="transparent"
          onPointerEnter={() => onIndex(i)}
          onPointerDown={() => onIndex(i)}
          onPointerLeave={() => onIndex(null)}
          data-testid={`chart-hit-${i}`}
        />
      ))}
    </>
  );
}

/** Range pill row (timeframe selector). Safe immediate interaction — haptic selection. */
export function RangePills<R extends string>({
  ranges,
  active,
  onChange,
  label,
  testIdPrefix,
}: {
  ranges: R[];
  active: R;
  onChange: (r: R) => void;
  label: (r: R) => string;
  testIdPrefix: string;
}) {
  return (
    <div className="flex gap-2" data-testid={`${testIdPrefix}-ranges`}>
      {ranges.map((r) => (
        <button
          key={r}
          type="button"
          aria-pressed={active === r}
          onClick={() => onChange(r)}
          className={cn(
            "h-8 rounded-full px-3 text-xs transition-colors duration-200 ease-out",
            active === r
              ? "bg-primary/12 font-semibold text-primary"
              : "text-muted-foreground",
          )}
          data-testid={`${testIdPrefix}-range-${r}`}
        >
          {label(r)}
        </button>
      ))}
    </div>
  );
}
