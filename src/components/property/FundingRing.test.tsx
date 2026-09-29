import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FundingRing } from "@/components/property/FundingRing";

describe("FundingRing", () => {
  it("renders the percent label with an accessible name", () => {
    render(<FundingRing progress={0.92} label="92%" />);
    const ring = screen.getByTestId("funding-ring");
    expect(ring).toHaveTextContent("92%");
    expect(ring).toHaveAttribute("aria-label", "92%");
  });

  it("scales the arc with progress and clamps out-of-range input", () => {
    const { container, rerender } = render(<FundingRing progress={0.5} label="50%" />);
    const arc = () => container.querySelector('[data-testid="funding-ring-arc"]');
    const dash = () => arc()?.getAttribute("stroke-dasharray") ?? "";
    const half = parseFloat(dash().split(" ")[0] ?? "0");
    rerender(<FundingRing progress={1} label="100%" />);
    expect(parseFloat(dash().split(" ")[0] ?? "0")).toBeGreaterThan(half);
    rerender(<FundingRing progress={0} label="0%" />);
    expect(dash().startsWith("0")).toBe(true);
    rerender(<FundingRing progress={2} label="200%" />);
    const full = dash();
    rerender(<FundingRing progress={-1} label="-100%" />);
    expect(dash().startsWith("0")).toBe(true);
    expect(full.startsWith("0")).toBe(false);
  });
});
