// Tests for the shared ScenarioCards primitive (Estate Page Structure §5.2):
// controlled selection, one expanded card, collapsed headline, detail rows,
// a11y wiring (aria-expanded / aria-controls).
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ScenarioCards, type ScenarioCardItem } from "./ScenarioCards";

const ITEMS: ScenarioCardItem[] = [
  {
    key: "conservative",
    label: "Conservative",
    headline: "$180 /yr",
    headlineNote: "220 modeled nights",
    rows: [
      { label: "Gross annual revenue", value: "$17.6M", testId: "row-conservative-gross" },
      { label: "Per share / year", value: "$180", testId: "row-conservative-annual" },
    ],
  },
  {
    key: "base",
    label: "Base",
    headline: "$195 /yr",
    headlineNote: "273 modeled nights",
    rows: [
      { label: "Gross annual revenue", value: "$21.9M", testId: "row-base-gross" },
      { label: "Per share / year", value: "$195", testId: "row-base-annual" },
    ],
  },
];

function renderCards(selectedKey = "base", onSelect = vi.fn()) {
  return render(<ScenarioCards items={ITEMS} selectedKey={selectedKey} onSelect={onSelect} />);
}

describe("ScenarioCards", () => {
  it("renders every card collapsed except the selected one", () => {
    renderCards("base");
    expect(screen.getByTestId("scenario-cards-base")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("scenario-cards-conservative")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByTestId("scenario-cards-conservative-detail")).not.toBeInTheDocument();
  });

  it("shows the collapsed headline and basis note", () => {
    renderCards("base");
    expect(screen.getByText("$180 /yr")).toBeInTheDocument();
    expect(screen.getByText("220 modeled nights")).toBeInTheDocument();
  });

  it("renders the selected card's detail rows", () => {
    renderCards("base");
    expect(screen.getByTestId("row-base-gross")).toHaveTextContent("$21.9M");
    expect(screen.getByTestId("row-base-annual")).toHaveTextContent("$195");
  });

  it("notifies onSelect with the pressed card's key (controlled selection)", () => {
    const onSelect = vi.fn();
    renderCards("base", onSelect);
    fireEvent.click(screen.getByTestId("scenario-cards-conservative"));
    expect(onSelect).toHaveBeenCalledWith("conservative");
    // Controlled: the card does not expand until the caller changes the prop.
    expect(screen.queryByTestId("scenario-cards-conservative-detail")).not.toBeInTheDocument();
  });

  it("expands the new selection when the caller updates the prop", () => {
    const view = renderCards("base");
    fireEvent.click(screen.getByTestId("scenario-cards-conservative"));
    view.rerender(<ScenarioCards items={ITEMS} selectedKey="conservative" onSelect={vi.fn()} />);
    expect(screen.getByTestId("scenario-cards-conservative-detail")).toBeInTheDocument();
    expect(screen.queryByTestId("scenario-cards-base-detail")).not.toBeInTheDocument();
  });

  it("wires aria-controls to the rendered detail region", () => {
    renderCards("base");
    expect(screen.getByTestId("scenario-cards-base")).toHaveAttribute(
      "aria-controls",
      "scenario-cards-base-detail",
    );
    expect(screen.getByTestId("scenario-cards-base-detail")).toHaveAttribute(
      "id",
      "scenario-cards-base-detail",
    );
  });
});
