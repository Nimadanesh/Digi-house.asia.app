import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { FlipwaveGrid } from "@/components/flipwave/FlipwaveGrid";
import { GRID_COLS, GRID_ROWS, HOUSE_MASK } from "@/lib/flipwave/house-mask";

function countLit(mask: readonly (readonly number[])[]): number {
  let n = 0;
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      if (mask[r]?.[c] === 1) n += 1;
    }
  }
  return n;
}

describe("FlipwaveGrid", () => {
  it("renders 21×13 cells, animating only the lit mask cells by default", () => {
    const { container } = render(
      <FlipwaveGrid mask={HOUSE_MASK} variant="house" />,
    );
    expect(container.querySelectorAll(".fw-cell").length).toBe(GRID_COLS * GRID_ROWS);
    expect(container.querySelectorAll(".fw-cell.fw-animate").length).toBe(
      countLit(HOUSE_MASK),
    );
  });

  it("animates every cell when flipUnlit is set (loader mode)", () => {
    const { container } = render(
      <FlipwaveGrid mask={HOUSE_MASK} variant="house" flipUnlit />,
    );
    expect(container.querySelectorAll(".fw-cell.fw-animate").length).toBe(
      GRID_COLS * GRID_ROWS,
    );
  });

  it("colours lit cells blue and dims the rest", () => {
    const { container } = render(
      <FlipwaveGrid mask={HOUSE_MASK} variant="house" flipUnlit />,
    );
    const litCount = countLit(HOUSE_MASK);
    const backs = container.querySelectorAll(".fw-cell.fw-animate .fw-back");
    const styles = Array.from(backs).map((b) => b.getAttribute("style") ?? "");
    // jsdom normalises the inline hex to rgb(): #229ED9 → rgb(34, 158, 217),
    // #334155 → rgb(51, 65, 85).
    const blues = styles.filter((s) => s.includes("34, 158, 217")).length;
    const dims = styles.filter((s) => s.includes("51, 65, 85")).length;
    expect(styles).toHaveLength(GRID_COLS * GRID_ROWS);
    expect(blues).toBe(litCount);
    expect(dims).toBe(GRID_COLS * GRID_ROWS - litCount);
  });

  it("shows nothing animated for an all-empty mask", () => {
    const empty = Array.from({ length: GRID_ROWS }, () =>
      Array.from({ length: GRID_COLS }, () => 0),
    );
    const { container } = render(<FlipwaveGrid mask={empty} variant="dollar" />);
    expect(container.querySelectorAll(".fw-cell.fw-animate").length).toBe(0);
  });

  it("does not pause by default (active grid keeps animating)", () => {
    const { container } = render(<FlipwaveGrid mask={HOUSE_MASK} variant="house" />);
    expect(container.querySelector(".fw-grid")).not.toHaveClass("fw-paused");
  });

  it("adds fw-paused when active={false} so all flips freeze", () => {
    const { container } = render(
      <FlipwaveGrid mask={HOUSE_MASK} variant="house" active={false} />,
    );
    expect(container.querySelector(".fw-grid")).toHaveClass("fw-paused");
    // Cells keep their .fw-animate class — freezing happens via CSS
    // (animation-play-state: paused), so the settled state is preserved.
    expect(container.querySelectorAll(".fw-cell.fw-animate").length).toBe(
      countLit(HOUSE_MASK),
    );
  });
});