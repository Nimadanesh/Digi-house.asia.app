// File responsibility: pure radial-stagger timing for the Braille Flipwave loader (CSS/DOM renderer).
// No three, no React. The wave "starts" a disc after distance×55ms, so a ring ripples outward.
import {
  GRID_COLS,
  GRID_ROWS,
  GRID_CENTER_COL,
  GRID_CENTER_ROW,
} from "./house-mask";

export const STAGGER_MS_PER_UNIT = 55;

/** Radial stagger for one disc: distance from grid center × ms-per-unit. */
export function radialDelayMs(col: number, row: number): number {
  return (
    Math.hypot(col - GRID_CENTER_COL, row - GRID_CENTER_ROW) *
    STAGGER_MS_PER_UNIT
  );
}

/** Largest single-disc delay — ~641ms for the 21×13 grid corner cells. */
export function maxRadialDelayMs(): number {
  let max = 0;
  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      max = Math.max(max, radialDelayMs(col, row));
    }
  }
  return max;
}

/** Named flipwave motion patterns — one per onboarding slide (and the loader = "house"). */
export type FlipwaveVariant = "house" | "bars" | "dollar";

/** Per-cell flip stagger: each variant ripples in a distinct, themed direction. */
export function cellDelayMs(
  col: number,
  row: number,
  variant: FlipwaveVariant,
): number {
  switch (variant) {
    case "house":
      return radialDelayMs(col, row);
    case "bars":
      return (GRID_ROWS - 1 - row) * 60; // bottom→top: earnings stacking up
    case "dollar":
      return (GRID_ROWS - 1 - row) * 45; // bottom→top, quicker: money rising
  }
}
