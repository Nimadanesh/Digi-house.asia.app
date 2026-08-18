// CSS contract test for the Flipwave mobile path.
// jsdom can't evaluate CSS, so this reads the shipped stylesheet and pins the
// invariants that guarantee lit cells settle BLUE on touch devices:
//   1. .fw-cell keeps transform-style: preserve-3d inside the touch media block
//      (flat + backface-visibility hides the blue back face forever — the
//      "static dark dots" regression).
//   2. The touch block uses the two-cycle fw-flip-twice-settle animation with
//      fill-mode both: 2 full appear/disappear cycles, then a blue settle —
//      and never loops infinitely.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

const cssPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../src/app/globals.css",
);
const css = readFileSync(cssPath, "utf8");

const TOUCH_QUERY = "@media (hover: none) and (pointer: coarse)";
const KEYFRAMES = "@keyframes fw-flip-twice-settle";

function touchBlock(): string {
  const start = css.indexOf(TOUCH_QUERY);
  expect(start).toBeGreaterThanOrEqual(0); // touch block must exist
  const end = css.indexOf(KEYFRAMES, start);
  expect(end).toBeGreaterThan(start);
  return css.slice(start, end);
}

describe("flipwave mobile CSS contract (two-cycle settle-blue guarantee)", () => {
  it("keeps .fw-cell in 3D inside the touch block (preserve-3d, never flat)", () => {
    const block = touchBlock();
    // Only the .fw-cell rules matter (the .fw-grid container may be flat).
    const cellRules = block.slice(block.indexOf(".fw-cell"));
    // A flat cell context makes backface-visibility judge each face from its
    // own transform: the back face (rotateX(180deg)) is always hidden, so lit
    // cells stay on the dark front face and blue never appears.
    expect(cellRules).toMatch(/transform-style:\s*preserve-3d/);
    expect(cellRules).not.toMatch(/transform-style:\s*flat/);
  });

  it("uses the two-cycle animation with fill-mode both (no infinite loop on mobile)", () => {
    const block = touchBlock();
    expect(block).toMatch(/fw-flip-twice-settle\s+6000ms\s+linear\s+both/);
    // No infinite iterations inside the touch block.
    expect(block.match(/animation:[^;]*infinite/g) ?? []).toHaveLength(0);
    // The settled/fallback transform points at the visible back face.
    expect(block).toMatch(/transform:\s*rotateX\(180deg\)/);
  });

  it("fw-flip-twice-settle plays 2 appear/disappear cycles and settles blue", () => {
    const kf = css.slice(css.indexOf(KEYFRAMES));
    const degrees = Array.from(
      kf.matchAll(/rotateX\((\d+)deg\)/g),
      (m) => Number(m[1]),
    );
    // Starts dark, ends blue (held).
    expect(degrees[0]).toBe(0);
    expect(degrees[degrees.length - 1]).toBe(180);
    // Count transitions: 3 dark→blue (2 cycles + final settle) and 2 blue→dark.
    let appearances = 0;
    let disappearances = 0;
    for (let i = 1; i < degrees.length; i++) {
      if (degrees[i]! > degrees[i - 1]!) appearances += 1;
      else if (degrees[i]! < degrees[i - 1]!) disappearances += 1;
    }
    expect(appearances).toBeGreaterThanOrEqual(3);
    expect(disappearances).toBeGreaterThanOrEqual(2);
  });
});
