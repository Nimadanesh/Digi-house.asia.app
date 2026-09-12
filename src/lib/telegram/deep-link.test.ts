// Slice F §14 (canonical identity): startapp=re_<canonical-id> must resolve to the
// correct canonical property. Legacy `prop_*` ids are rejected outright — no
// normalization ever resurrects them. Pure parser — no SDK, no router — so
// routing stays testable.
import { describe, expect, it } from "vitest";

import { parseEstateStartParam } from "@/lib/telegram/deep-link";

describe("parseEstateStartParam — canonical ids only", () => {
  it("resolves Grand 2 BDM (JOALI Being) from its canonical id", () => {
    expect(parseEstateStartParam("re-128862")).toBe("re-128862");
    expect(parseEstateStartParam("re_128862")).toBe("re-128862");
  });

  it("resolves a high-value estate (Pearls of Long Bay)", () => {
    expect(parseEstateStartParam("re_130397")).toBe("re-130397");
  });

  it("resolves a DYNAMIC-rate estate (La Dolce Vita) with identical rules", () => {
    expect(parseEstateStartParam("re_122903")).toBe("re-122903");
  });

  it("resolves a STARTING_FROM estate (Trajan) with identical rules", () => {
    expect(parseEstateStartParam("re-128529")).toBe("re-128529");
  });

  it("normalizes underscores but only exact canonical ids resolve (name-slugs are not ids)", () => {
    // Underscore → hyphen normalization never invents an id: only the exact
    // `re-<listingId>` form is canonical. A name-slug is not an id.
    expect(parseEstateStartParam("re_mita_principe")).toBeNull();
  });

  it("strips an optional ~utm suffix without changing the property", () => {
    expect(parseEstateStartParam("re_128862~utm_site")).toBe("re-128862");
    expect(parseEstateStartParam("re-128862~utm_site")).toBe("re-128862");
  });

  it("rejects every legacy prop_* / prop- form outright (never remapped)", () => {
    expect(parseEstateStartParam("prop_marina-vista-4b")).toBeNull();
    expect(parseEstateStartParam("prop-128862")).toBeNull();
    expect(parseEstateStartParam("prop_does-not-exist")).toBeNull();
    expect(parseEstateStartParam("prop_")).toBeNull();
  });

  it("rejects unknown, empty and non-estate params (never falls back to another property)", () => {
    expect(parseEstateStartParam(null)).toBeNull();
    expect(parseEstateStartParam(undefined)).toBeNull();
    expect(parseEstateStartParam("")).toBeNull();
    expect(parseEstateStartParam("ref_123")).toBeNull();
    expect(parseEstateStartParam("re-does-not-exist")).toBeNull();
    expect(parseEstateStartParam("re_")).toBeNull();
    expect(parseEstateStartParam("~utm_site")).toBeNull();
  });
});
