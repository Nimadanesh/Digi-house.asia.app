// Phase 9 Slice 7 — tab-strip arrow-key direction follows document direction.
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PropertyTabs } from "@/components/property/PropertyTabs";

afterEach(() => {
  document.documentElement.dir = "ltr";
});

function renderTabs(active: "estate" | "income" | "ownership" | "details" = "estate") {
  const onChange = vi.fn();
  render(<PropertyTabs active={active} onChange={onChange} />);
  return onChange;
}

describe("PropertyTabs keyboard (LTR)", () => {
  it("ArrowRight moves next, ArrowLeft moves previous", () => {
    const onChange = renderTabs("income");
    fireEvent.keyDown(screen.getByTestId("property-tabs"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("ownership");
    fireEvent.keyDown(screen.getByTestId("property-tabs"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("estate");
  });
});

describe("PropertyTabs keyboard (RTL)", () => {
  it("ArrowLeft moves next, ArrowRight moves previous", () => {
    document.documentElement.dir = "rtl";
    const onChange = renderTabs("income");
    fireEvent.keyDown(screen.getByTestId("property-tabs"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("ownership");
    fireEvent.keyDown(screen.getByTestId("property-tabs"), { key: "ArrowRight" });
    expect(onChange).toHaveBeenCalledWith("estate");
  });
});
