import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeEmptyState } from "@/components/home/HomeEmptyState";

describe("HomeEmptyState — ownership first", () => {
  it("renders the ownership copy and an Explore Estates CTA", () => {
    render(<HomeEmptyState />);
    expect(screen.getByTestId("home-empty-state")).toBeInTheDocument();
    expect(screen.getByText("You don't own any estates yet")).toBeInTheDocument();
    expect(screen.getByText("Explore Estates")).toBeInTheDocument();
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