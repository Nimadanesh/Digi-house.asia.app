import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LuxeCircleSection } from "@/components/circle/LuxeCircleSection";

describe("LuxeCircleSection", () => {
  it("renders the honest empty network with no fabricated data", () => {
    const { container } = render(<LuxeCircleSection />);
    expect(screen.getByTestId("club-circle")).toBeInTheDocument();
    expect(screen.getByText("Your Luxe Circle")).toBeInTheDocument();
    expect(screen.getByTestId("circle-counts")).toHaveTextContent("0 Members");
    expect(screen.getByTestId("circle-counts")).toHaveTextContent("0 Shared Properties");
    expect(screen.getByTestId("circle-shared-empty")).toHaveTextContent("No shared properties yet.");
    expect(screen.getByTestId("circle-invite")).toHaveAttribute("href", "/marketplace");
    expect(screen.getByTestId("circle-explore")).toHaveAttribute("href", "/marketplace");
    expect(container.textContent).not.toMatch(/[1-9]\d* Members/);
    expect(screen.queryByTestId("referral-milestone")).not.toBeInTheDocument();
  });
});
