// Tests for the shared IconPointsGrid primitive (Estate Page Structure §4.1/§4.3):
// point rendering (label + optional icon), column-count variants, empty → null.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { IconPointsGrid, type IconPoint } from "./IconPointsGrid";

const POINTS: IconPoint[] = [
  { id: "beachfront", label: "Beachfront access", icon: <svg data-testid="icon-beach" /> },
  { id: "pool", label: "Infinity pool", icon: <svg data-testid="icon-pool" /> },
  { id: "staff", label: "Full staff" },
];

describe("IconPointsGrid", () => {
  it("renders every point with its label and optional icon", () => {
    render(<IconPointsGrid points={POINTS} />);
    expect(screen.getAllByTestId("icon-points-grid-point")).toHaveLength(3);
    expect(screen.getByText("Beachfront access")).toBeInTheDocument();
    expect(screen.getByTestId("icon-beach")).toBeInTheDocument();
    // Label-only point renders without an icon slot.
    expect(screen.queryByTestId("icon-staff")).not.toBeInTheDocument();
  });

  it("defaults to two columns", () => {
    render(<IconPointsGrid points={POINTS} />);
    expect(screen.getByTestId("icon-points-grid")).toHaveClass("grid-cols-2");
  });

  it("renders three columns when requested", () => {
    render(<IconPointsGrid points={POINTS} columns={3} />);
    expect(screen.getByTestId("icon-points-grid")).toHaveClass("grid-cols-3");
  });

  it("renders nothing for an empty point list", () => {
    const { container } = render(<IconPointsGrid points={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
