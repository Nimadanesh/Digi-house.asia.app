import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { FundingBar } from "@/components/property/FundingBar";

describe("FundingBar — DESIGN_SYSTEM §'Funding / progress bar'", () => {
  it("animates via transform: scaleX() with transform-origin: left (never width)", () => {
    const { container } = render(<FundingBar progress={0.5} />);
    const fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill).not.toBeNull();
    const style = fill.style;
    // transform: scaleX(0.5) — the spec mandates scaleX, never width animation
    expect(style.transform).toBe("scaleX(0.5)");
    expect(style.transformOrigin).toBe("left");
    // transition uses the easing token, not a literal cubic-bezier
    expect(style.transition).toContain("var(--ease-tg-out)");
    expect(style.transition).not.toMatch(/cubic-bezier/);
  });

  it("funded=true fills with --success (bg-success), else --primary (bg-primary)", () => {
    const { container, rerender } = render(<FundingBar progress={1} funded />);
    let fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.className).toContain("bg-success");
    rerender(<FundingBar progress={0.5} funded={false} />);
    fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.className).toContain("bg-primary");
  });

  it("clamps progress to [0, 1] (negative -> 0, >1 -> 1)", () => {
    const { container, rerender } = render(<FundingBar progress={-0.5} />);
    let fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.style.transform).toBe("scaleX(0)");
    rerender(<FundingBar progress={1.5} />);
    fill = container.querySelector(".funding-bar-fill") as HTMLElement;
    expect(fill.style.transform).toBe("scaleX(1)");
  });
});