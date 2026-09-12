// PROMPT 03-C: Income + Ownership display identity resolves canonical-first.
import { describe, expect, it } from "vitest";

import { PROPERTIES } from "@/lib/mock/seed/properties";
import { getCanonicalEstate } from "../estates/canonical-24";
import { getEstate24ByRuntimeId } from "../estates/estate-24-data";
import {
  getEstateDisplayIdentity,
  getEstateDisplayName,
} from "../estates/estate-display-identity";

describe("PROMPT 03-C: canonical display identity", () => {
  it("resolves Grand 2 BDM from ESTATE-24/canonical, not the legacy fixture", () => {
    const id = "re-128862";
    const legacy = PROPERTIES.find((p) => p.id === id)!;
    const identity = getEstateDisplayIdentity(id, {
      title: legacy.title,
      location: legacy.location,
      images: legacy.images,
    });
    expect(identity.name).toBe("Grand 2 BDM Ocean Pool Villa (JOALI Being)");
    expect(identity.name).not.toBe(legacy.title);
    expect(identity.location).toBe(
      getEstate24ByRuntimeId(id)!.location.full,
    );
    expect(identity.location).not.toBe(legacy.location);
    expect(identity.image).toBe(getCanonicalEstate(id)!.images.urls[0]);
    expect(
      getEstateDisplayName(id, legacy.title),
    ).toBe("Grand 2 BDM Ocean Pool Villa (JOALI Being)");
  });

  it("resolves all 24 canonical estates without legacy fallback", () => {
    expect(PROPERTIES).toHaveLength(24);
    for (const p of PROPERTIES) {
      const estate24 = getEstate24ByRuntimeId(p.id);
      expect(estate24, `${p.id} has a canonical record`).toBeDefined();
      const identity = getEstateDisplayIdentity(p.id, {
        title: p.title,
        location: p.location,
        images: p.images,
      });
      expect(identity.name, `${p.id} name`).toBe(estate24!.name);
      expect(identity.location, `${p.id} location`).toBe(
        estate24!.location.full,
      );
      expect(identity.image, `${p.id} image`).toBe(
        getCanonicalEstate(p.id)!.images.urls[0],
      );
    }
  });

  it("stays honest for unknown ids (fallback, then id — never invented)", () => {
    expect(
      getEstateDisplayIdentity("test-unknown-id", {
        title: "Fallback Villa",
        location: "Nowhere",
        images: ["/images/fallback.png"],
      }),
    ).toEqual({
      name: "Fallback Villa",
      location: "Nowhere",
      image: "/images/fallback.png",
    });
    expect(getEstateDisplayIdentity("test-unknown-id")).toEqual({
      name: "test-unknown-id",
      location: "",
    });
    expect(getEstateDisplayName("test-unknown-id")).toBe(
      "test-unknown-id",
    );
    expect(getEstateDisplayName("test-unknown-id", "Fallback Villa")).toBe(
      "Fallback Villa",
    );
  });
});
