// Tests for the D7 locked location/transfer layer: full 1–24 coverage,
// CONFIRMED/APPROX status discipline (isEstimate follows status), runtime-id
// lookups, and the locked legal flag on the Trajan suite.
import { describe, expect, it } from "vitest";

import {
  ESTATE_LOCATION_DETAILS,
  getLocationDetailByEstate24Id,
  getLocationDetailByPropertyId,
} from "@/lib/economics/estates/location-details-24";

describe("location-details-24 — D7 locked data", () => {
  it("covers villas 1–24 exactly once with non-empty fields", () => {
    expect(ESTATE_LOCATION_DETAILS).toHaveLength(24);
    const ids = ESTATE_LOCATION_DETAILS.map((d) => d.estateId).sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    for (const detail of ESTATE_LOCATION_DETAILS) {
      expect(detail.locationText.length, `villa ${detail.estateId}`).toBeGreaterThan(0);
      expect(detail.islandOrResort.length).toBeGreaterThan(0);
      expect(detail.region.length).toBeGreaterThan(0);
      expect(detail.transfer.text.length).toBeGreaterThan(0);
    }
  });

  it("isEstimate follows the CONFIRMED/APPROX status exactly", () => {
    for (const detail of ESTATE_LOCATION_DETAILS) {
      expect(detail.transfer.isEstimate).toBe(detail.transfer.status === "APPROX");
    }
    // Locked marks: 11 CONFIRMED (incl. #17 inheriting #15) / 13 APPROX.
    expect(ESTATE_LOCATION_DETAILS.filter((d) => d.transfer.status === "CONFIRMED")).toHaveLength(11);
    expect(ESTATE_LOCATION_DETAILS.filter((d) => d.transfer.status === "APPROX")).toHaveLength(13);
  });

  it("resolves through the runtime propertyId join", () => {
    const joali = getLocationDetailByPropertyId("re-128862");
    expect(joali?.locationText).toMatch(/JOALI Being/);
    expect(joali?.transfer.status).toBe("CONFIRMED");
    const Hawksbill = getLocationDetailByEstate24Id(24);
    expect(Hawksbill?.locationText).toMatch(/Grace Bay/);
    expect(getLocationDetailByPropertyId("test-unknown")).toBeNull();
  });

  it("carries the locked villa-9 legal note and the resolved #15 reference on #17", () => {
    const trajan = getLocationDetailByEstate24Id(9);
    expect(trajan?.note).toMatch(/hotel suite product/);
    const pearls = getLocationDetailByEstate24Id(17);
    expect(pearls?.transfer.text).toMatch(/Same as La Dolce Vita \(#15\)/);
  });
});
