// Slice F §14: startapp=prop_<stable-id> must resolve to the correct canonical
// property. Pure parser — no SDK, no router — so routing stays testable.
import { describe, expect, it } from "vitest";

import { parseEstateStartParam } from "@/lib/telegram/deep-link";

describe("parseEstateStartParam", () => {
  it("resolves Grand 2 BDM", () => {
    expect(parseEstateStartParam("prop_marina-vista-4b")).toBe("prop-marina-vista-4b");
  });

  it("resolves a high-value estate (Pearls of Long Bay)", () => {
    expect(parseEstateStartParam("prop_mexico-city-penthouse")).toBe(
      "prop-mexico-city-penthouse",
    );
  });

  it("resolves a DYNAMIC-rate estate (La Dolce Vita) with identical rules", () => {
    expect(parseEstateStartParam("prop_miami-beach-condo")).toBe(
      "prop-miami-beach-condo",
    );
  });

  it("resolves a STARTING_FROM estate (Trajan) with identical rules", () => {
    expect(parseEstateStartParam("prop_berlin-mitte-apartment")).toBe(
      "prop-berlin-mitte-apartment",
    );
  });

  it("strips an optional ~utm suffix without changing the property", () => {
    expect(parseEstateStartParam("prop_marina-vista-4b~utm_site")).toBe(
      "prop-marina-vista-4b",
    );
  });

  it("rejects unknown, empty and non-estate params (never falls back to another property)", () => {
    expect(parseEstateStartParam(null)).toBeNull();
    expect(parseEstateStartParam(undefined)).toBeNull();
    expect(parseEstateStartParam("")).toBeNull();
    expect(parseEstateStartParam("ref_123")).toBeNull();
    expect(parseEstateStartParam("prop_does-not-exist")).toBeNull();
    expect(parseEstateStartParam("prop_")).toBeNull();
  });
});
