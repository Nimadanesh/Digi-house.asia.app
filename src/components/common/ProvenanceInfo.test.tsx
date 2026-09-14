// Tests for the global ProvenanceInfo pattern: compact trigger for all five
// provenance states; plain-language explanation on demand via the Sheet.
// Data-layer provenance is untouched — this is presentation only.
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { Provenance } from "@/types/estate";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

const STATES: Array<{ provenance: Provenance; title: string; body: string }> = [
  { provenance: "observed", title: "Source information", body: "published listing" },
  { provenance: "estimated", title: "Estimated value", body: "Not a confirmed market valuation" },
  { provenance: "calculated", title: "Calculated figure", body: "Not historical performance" },
  { provenance: "projected", title: "Projected figure", body: "Not guaranteed income" },
  { provenance: "unknown", title: "Not available", body: "Currently unavailable" },
];

describe("ProvenanceInfo", () => {
  it("renders a compact trigger without visible provenance wording", () => {
    render(<ProvenanceInfo provenance="estimated" />);
    const trigger = screen.getByTestId("provenance-info");
    expect(trigger).toHaveAttribute("aria-label", "Estimated value");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger.textContent).not.toContain("Estimated value");
    expect(screen.queryByTestId("provenance-sheet")).not.toBeInTheDocument();
  });

  it("never nests a <button> (safe inside ancestor toggle buttons — hydration)", () => {
    const { container } = render(
      <button type="button">
        <span>
          <ProvenanceInfo provenance="unknown" />
        </span>
      </button>,
    );
    expect(screen.getByTestId("provenance-info").tagName).toBe("SPAN");
    expect(container.querySelector("button button")).toBeNull();
  });

  it("opens via keyboard (Enter) like a native control", () => {
    render(<ProvenanceInfo provenance="calculated" />);
    fireEvent.keyDown(screen.getByTestId("provenance-info"), { key: "Enter" });
    expect(screen.getByTestId("provenance-sheet")).toHaveTextContent("Calculated figure");
  });

  it.each(STATES)("opens the $provenance explanation on tap", ({ provenance, title, body }) => {
    render(<ProvenanceInfo provenance={provenance} />);
    fireEvent.click(screen.getByTestId("provenance-info"));
    const sheet = screen.getByTestId("provenance-sheet");
    expect(sheet).toHaveAttribute("data-provenance", provenance);
    expect(sheet).toHaveTextContent(title);
    expect(sheet).toHaveTextContent(body);
  });
});
