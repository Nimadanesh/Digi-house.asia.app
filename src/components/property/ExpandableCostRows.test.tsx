// Tests for the shared ExpandableCostRows primitive (Estate Page Structure §5.3):
// row rendering (label/basis/value), independent per-row expansion, detail +
// meta body, a11y wiring (aria-expanded / aria-controls).
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ExpandableCostRows, type CostRowItem } from "./ExpandableCostRows";

const ROWS: CostRowItem[] = [
  {
    id: "agency",
    label: "Agency / OTA",
    basis: "5% of gross",
    value: "$1.1M",
    detail: "Rental Escapes / OTA commission on gross revenue.",
    meta: [{ label: "Basis", value: "5% of gross" }],
  },
  {
    id: "reserve",
    label: "Reserve",
    basis: "1.5% of property value",
    value: "$120K",
    detail: null,
    meta: [{ label: "Currency", value: "USD" }],
  },
  {
    id: "operator",
    label: "Operator",
    value: "$1.6M",
  },
];

describe("ExpandableCostRows", () => {
  it("renders every row collapsed with label, basis and value", () => {
    render(<ExpandableCostRows rows={ROWS} />);
    expect(screen.getAllByTestId("expandable-cost-rows-item")).toHaveLength(3);
    expect(screen.getByTestId("expandable-cost-rows-agency")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByText("5% of gross")).toBeInTheDocument();
    expect(screen.getByText("$1.1M")).toBeInTheDocument();
    expect(screen.queryByTestId("expandable-cost-rows-agency-detail")).not.toBeInTheDocument();
  });

  it("expands a row's detail and meta on click", () => {
    render(<ExpandableCostRows rows={ROWS} />);
    fireEvent.click(screen.getByTestId("expandable-cost-rows-agency"));
    expect(screen.getByTestId("expandable-cost-rows-agency")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByText("Rental Escapes / OTA commission on gross revenue."),
    ).toBeInTheDocument();
    expect(screen.getByText("Basis")).toBeInTheDocument();
  });

  it("expands rows independently", () => {
    render(<ExpandableCostRows rows={ROWS} />);
    fireEvent.click(screen.getByTestId("expandable-cost-rows-agency"));
    fireEvent.click(screen.getByTestId("expandable-cost-rows-reserve"));
    expect(screen.getByTestId("expandable-cost-rows-agency-detail")).toBeInTheDocument();
    expect(screen.getByTestId("expandable-cost-rows-reserve-detail")).toBeInTheDocument();
    expect(screen.getByText("Currency")).toBeInTheDocument();
    // Third row stays collapsed.
    expect(screen.getByTestId("expandable-cost-rows-operator")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("collapses a row again on second click", () => {
    render(<ExpandableCostRows rows={ROWS} />);
    fireEvent.click(screen.getByTestId("expandable-cost-rows-agency"));
    fireEvent.click(screen.getByTestId("expandable-cost-rows-agency"));
    expect(screen.getByTestId("expandable-cost-rows-agency")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByTestId("expandable-cost-rows-agency-detail")).not.toBeInTheDocument();
  });

  it("renders meta rows without a detail paragraph (null detail)", () => {
    render(<ExpandableCostRows rows={ROWS} />);
    fireEvent.click(screen.getByTestId("expandable-cost-rows-reserve"));
    expect(screen.getByTestId("expandable-cost-rows-reserve-detail")).toHaveTextContent("USD");
    expect(screen.queryByText("1.5% of property value")).toBeInTheDocument();
  });

  it("wires aria-controls to the rendered detail region", () => {
    render(<ExpandableCostRows rows={ROWS} />);
    fireEvent.click(screen.getByTestId("expandable-cost-rows-agency"));
    expect(screen.getByTestId("expandable-cost-rows-agency-detail")).toHaveAttribute(
      "id",
      "expandable-cost-rows-agency-detail",
    );
  });
});
