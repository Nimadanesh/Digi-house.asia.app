"use client";
// File responsibility: reusable Braille Flipwave dot grid — renders a 21×13 dot matrix where mask
// cells flip to a back color (and, optionally, unlit cells flip to a dim tone), with a per-variant
// stagger. Pure presentational CSS/DOM — no WebGL.
import { useMemo, type CSSProperties } from "react";
import { GRID_COLS, GRID_ROWS } from "@/lib/flipwave/house-mask";
import {
  cellDelayMs,
  type FlipwaveVariant,
} from "@/lib/flipwave/flipwave-math";
import { cn } from "@/lib/utils";

export const FLIP_FRONT_COLOR = "#1E293B";
export const FLIP_BLUE_COLOR = "#3390EC";
export const FLIP_DIM_COLOR = "#334155";

export function FlipwaveGrid({
  mask,
  variant,
  className,
  cellSize = 12,
  gap = 3,
  cycleMs = 4400,
  flipUnlit = false,
  active = true,
}: {
  mask: readonly (readonly number[])[];
  variant: FlipwaveVariant;
  className?: string;
  cellSize?: number;
  gap?: number;
  cycleMs?: number;
  /** True when unlit cells also flip (to a dim tone) — the loader does this; slides don't. */
  flipUnlit?: boolean;
  /** When false, the grid gets .fw-paused: all flip + idle animations freeze.
   *  Used by the carousel so only the visible slide animates. */
  active?: boolean;
}) {
  const cells = useMemo(() => {
    const out: {
      key: string;
      delay: number;
      animate: boolean;
      back: string;
    }[] = [];
    for (let row = 0; row < GRID_ROWS; row++) {
      for (let col = 0; col < GRID_COLS; col++) {
        const lit = mask[row]?.[col] === 1;
        const animate = lit || flipUnlit;
        out.push({
          key: `${col}-${row}`,
          delay: animate ? cellDelayMs(col, row, variant) : 0,
          animate,
          back: lit ? FLIP_BLUE_COLOR : FLIP_DIM_COLOR,
        });
      }
    }
    return out;
  }, [mask, variant, flipUnlit]);

  const gridStyle = {
    "--fw-cycle": `${cycleMs}ms`,
    gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${GRID_ROWS}, ${cellSize}px)`,
    gap: `${gap}px`,
  } as CSSProperties;

  return (
    <div
      dir="ltr"
      className={cn("fw-grid", active === false && "fw-paused", className)}
      style={gridStyle}
    >
      {cells.map((cell) => (
        <div
          key={cell.key}
          className={cn("fw-cell", cell.animate && "fw-animate")}
          style={cell.animate ? { animationDelay: `${cell.delay}ms` } : undefined}
        >
          <span
            className="fw-face fw-front"
            style={{ background: FLIP_FRONT_COLOR }}
          />
          <span className="fw-face fw-back" style={{ background: cell.back }} />
        </div>
      ))}
    </div>
  );
}