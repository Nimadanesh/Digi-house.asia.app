// File responsibility: 21×13 house-silhouette bitmap (grid data) for the Braille Flipwave loader.
// Pure data + one lookup — no three, no React. The house "emerges" where mask cells are 1.
export const GRID_COLS = 21;
export const GRID_ROWS = 13;
export const GRID_SPACING = 1;
export const GRID_CENTER_COL = Math.floor(GRID_COLS / 2); // 10
export const GRID_CENTER_ROW = Math.floor(GRID_ROWS / 2); // 6
export const DISC_COUNT = GRID_COLS * GRID_ROWS;

// '#': disc is part of the house silhouette. '.' : outside. 21 chars per row, 13 rows.
const HOUSE_ROWS: readonly string[] = [
  "..........#..........",
  ".........###.........",
  "........#####........",
  ".......#######.......",
  ".....###########.....",
  "....#############....",
  "...###############...",
  "...###############...",
  "...###############...",
  "...######...######...",
  "...######...######...",
  "...######...######...",
  "...###############...",
];

/** Parse '#'/'·' rows into a 0/1 mask (shared by all flipwave masks). */
export function maskFromRows(rows: readonly string[]): number[][] {
  return rows.map((row) => Array.from(row, (ch) => (ch === "#" ? 1 : 0)));
}

export const HOUSE_MASK: readonly (readonly number[])[] = maskFromRows(HOUSE_ROWS);

export function isInHouse(col: number, row: number): boolean {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false;
  return HOUSE_MASK[row]![col] === 1;
}
