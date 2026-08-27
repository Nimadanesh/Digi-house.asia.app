import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";

describe("HomeEmptyState — Buy shares → Lock → Earn", () => {
  it("renders the three calm steps and a Marketplace CTA", () => {
    render(<HomeEmptyState />);
    expect(screen.getByTestId("home-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("empty-step-buy")).toHaveTextContent("Buy shares");
    expect(screen.getByTestId("empty-step-lock")).toHaveTextContent("Lock them to earn yield");
    expect(screen.getByTestId("empty-step-earn")).toHaveTextContent("Earn every month");
    expect(screen.getByTestId("empty-browse-marketplace")).toHaveAttribute(
      "href",
      "/marketplace",
    );
  });

  it("calls the haptic on the CTA tap when provided", () => {
    const onNavigateHaptic = vi.fn();
    render(<HomeEmptyState onNavigateHaptic={onNavigateHaptic} />);
    screen.getByTestId("empty-browse-marketplace").click();
    expect(onNavigateHaptic).toHaveBeenCalledTimes(1);
  });
});