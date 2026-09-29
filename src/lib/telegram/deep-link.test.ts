// Slice F §14 (canonical identity): startapp=re_<canonical-id> must resolve to the
// correct canonical property. Legacy `prop_*` ids are rejected outright — no
// normalization ever resurrects them. Pure parser — no SDK, no router — so
// routing stays testable.
import { describe, expect, it } from "vitest";

import { parseEstateStartParam, parseShareStartParam } from "@/lib/telegram/deep-link";

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

describe("parseShareStartParam — shared estates land on the SAME estate", () => {
  it("resolves an ownership-share link to the estate + inviter context", () => {
    expect(parseShareStartParam("own_re-128862_ref_u1")).toEqual({
      estateId: "re-128862",
      context: "ownership",
      inviterId: "u1",
    });
  });

  it("resolves a co-own invite link to the estate + inviter context", () => {
    expect(parseShareStartParam("coown_re-128862_ref_u1")).toEqual({
      estateId: "re-128862",
      context: "coown",
      inviterId: "u1",
    });
  });

  it("carries the estate context without an inviter when the ref part is missing", () => {
    expect(parseShareStartParam("coown_re-128862")).toEqual({
      estateId: "re-128862",
      context: "coown",
      inviterId: null,
    });
  });

  it("falls back to the plain estate deep link with an estate context", () => {
    expect(parseShareStartParam("re_128862")).toEqual({
      estateId: "re-128862",
      context: "estate",
      inviterId: null,
    });
  });

  it("strips a ~utm suffix on share links", () => {
    expect(parseShareStartParam("own_re-128862_ref_u1~utm_x")).toEqual({
      estateId: "re-128862",
      context: "ownership",
      inviterId: "u1",
    });
  });

  it("never routes to a generic destination for malformed/unknown links", () => {
    expect(parseShareStartParam(null)).toBeNull();
    expect(parseShareStartParam("")).toBeNull();
    expect(parseShareStartParam("coown_re-does-not-exist_ref_u1")).toBeNull();
    expect(parseShareStartParam("own__ref_u1")).toBeNull();
    expect(parseShareStartParam("ref_123")).toBeNull();
    expect(parseShareStartParam("coown_prop_old_ref_u1")).toBeNull();
    expect(parseShareStartParam("~utm_site")).toBeNull();
  });
});
