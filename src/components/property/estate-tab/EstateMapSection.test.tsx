import { describe, it, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EstateMapSection } from "@/components/property/estate-tab/EstateMapSection";
import { CANONICAL_RECONCILIATION } from "@/lib/economics/estates/canonical-24";

describe("EstateMapSection", () => {
  it("renders the map shell below Location for the anchored villa (Grand 2 BDM)", () => {
    render(<EstateMapSection propertyId="re-128862" />);
    expect(screen.getByTestId("estate-map")).toBeInTheDocument();
    expect(screen.getByTestId("estate-map-card")).toBeInTheDocument();
    expect(screen.getByTestId("estate-map-canvas")).toBeInTheDocument();
  });

  it("renders the identical map shell for all 24 canonical villas", () => {
    expect(CANONICAL_RECONCILIATION.map((r) => r.propertyId)).toHaveLength(24);
    for (const { propertyId } of CANONICAL_RECONCILIATION) {
      cleanup();
      render(<EstateMapSection propertyId={propertyId} />);
      expect(screen.getByTestId("estate-map"), propertyId).toBeInTheDocument();
      expect(screen.getByTestId("estate-map-canvas"), propertyId).toBeInTheDocument();
    }
  });

  it("renders nothing for ids without a display anchor", () => {
    const { container } = render(<EstateMapSection propertyId="test-unknown-villa" />);
    expect(screen.queryByTestId("estate-map")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});
