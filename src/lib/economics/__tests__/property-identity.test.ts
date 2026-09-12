// Global property-identity regression (canonicalization hardening).
//
// Locked invariants across ALL 24 canonical estates:
//   1. Exactly 24 canonical records; ids are the stable `re-<listingId>` scheme.
//   2. The web runtime seed mirrors the canonical registry 1:1 — id, canonical
//      name, canonical location, canonical gallery — so every URL and every UI
//      surface resolves exclusively through canonical identity.
//   3. URLs and deep-links are built only from the canonical id. No old `prop-*`
//      id, no old slug, and no retired display name can appear in any generated
//      URL, deep-link param, or user-visible marketplace text.
//   4. Deep-links reject legacy `prop_*`/`prop-…` params outright.
import { describe, expect, it } from "vitest";

import {
  CANONICAL_MARKETPLACE_ESTATES,
  getCanonicalEstate,
  getCanonicalEstateByListingId,
} from "@/lib/economics/estates/canonical-24";
import { getEstate24ByRuntimeId } from "@/lib/economics/estates/estate-24-data";
import { RETIRED_ESTATE_NAMES } from "@/lib/economics/estates/retired-names";
import { PROPERTIES } from "@/lib/mock/seed/properties";
import { toCanonicalListing } from "@/lib/mock/canonical-listing";
import { toMarketplaceEstate } from "@/lib/economics/marketplace-view-model";
import { ROUTES } from "@/lib/constants";
import { parseEstateStartParam } from "@/lib/telegram/deep-link";

const CANONICAL = CANONICAL_MARKETPLACE_ESTATES;
const CANONICAL_BY_ID = new Map(CANONICAL.map((e) => [e.propertyId, e]));
const OLD_PROP_PREFIX = "prop-";
const OLD_PROP_PARAM_PREFIX = "prop_";

describe("canonical registry — 24 real properties", () => {
  it("holds exactly 24 canonical estates with stable re-<listingId> ids", () => {
    expect(CANONICAL).toHaveLength(24);
    for (const estate of CANONICAL) {
      expect(estate.propertyId).toMatch(/^re-\d+$/);
      expect(getCanonicalEstate(estate.propertyId)).toBe(estate);
      expect(
        getCanonicalEstateByListingId(estate.rentalEscapesListingId),
      ).toBe(estate);
    }
  });

  it("retired-name registry covers all 24 ids exactly (test data parity)", () => {
    expect(Object.keys(RETIRED_ESTATE_NAMES).sort()).toEqual(
      CANONICAL.map((e) => e.propertyId).sort(),
    );
  });
});

describe("identity mirrors the canonical record for all 24", () => {
  /** Canonical name minus a parenthetical qualifier, e.g. "Grand 2 BDM Ocean Pool Villa". */
  function baseName(name: string): string {
    return name.split(" (")[0]!;
  }

  it("web runtime seed carries every canonical id", () => {
    expect(PROPERTIES.map((p) => p.id).sort()).toEqual(
      CANONICAL.map((e) => e.propertyId).sort(),
    );
  });

  it("seed identity strings are canonical or canonical-base — never retired", () => {
    for (const p of PROPERTIES) {
      const canonical = CANONICAL_BY_ID.get(p.id)!;
      const retired = RETIRED_ESTATE_NAMES[p.id]!;
      expect(
        [canonical.name.value, baseName(canonical.name.value)],
        `${p.id} title`,
      ).toContain(p.title);
      expect(p.location, p.id).not.toContain(retired.name);
      expect(p.images[0], p.id).toBe(canonical.images.urls[0]);
    }
  });

  it("no canonical id ever carries its retired display name", () => {
    for (const p of PROPERTIES) {
      const retired = RETIRED_ESTATE_NAMES[p.id]!;
      expect(p.title, p.id).not.toBe(retired.name);
      expect(p.location, `${p.id} location`).not.toContain(retired.name);
      for (const image of p.images) {
        expect(image, `${p.id} image`).not.toContain(retired.slug);
      }
    }
  });
});

describe("URLs resolve exclusively through canonical ids (all 24)", () => {
  it("route builder emits /property/<canonical-id> and nothing else", () => {
    for (const estate of CANONICAL) {
      expect(ROUTES.property(estate.propertyId)).toBe(
        `/property/${estate.propertyId}`,
      );
      expect(ROUTES.property(estate.propertyId)).not.toContain(OLD_PROP_PREFIX);
    }
  });

  it("canonicalized seed listings link by canonical id only (all 24)", () => {
    for (const p of PROPERTIES) {
      const vm = toMarketplaceEstate(toCanonicalListing(p));
      expect(vm.id).toBe(p.id);
      // Every property link surface derives from the same id — canonical.
      const url = ROUTES.property(vm.id);
      expect(url).toBe(`/property/${p.id}`);
      expect(url.startsWith("/property/prop-")).toBe(false);
      // No retired slug can reconstruct a URL for a canonical estate.
      const retired = RETIRED_ESTATE_NAMES[p.id]!;
      expect(url).not.toContain(retired.slug);
      // User-visible marketplace identity follows the canonical sourcing rule
      // (Estate24 record first, canonical R2 record fallback — never fixture).
      const expectedName = getEstate24ByRuntimeId(p.id)?.name ?? CANONICAL_BY_ID.get(p.id)!.name.value;
      const expectedLocation = getEstate24ByRuntimeId(p.id)?.location.full ?? CANONICAL_BY_ID.get(p.id)!.location.value;
      expect(vm.name, p.id).toBe(expectedName);
      expect(vm.location, p.id).toBe(expectedLocation);
    }
  });
});

describe("deep-links accept canonical ids only (all 24)", () => {
  it("every canonical id round-trips through the Telegram start param", () => {
    for (const estate of CANONICAL) {
      const raw = estate.propertyId;
      expect(parseEstateStartParam(`re_${raw.slice("re-".length)}`)).toBe(raw);
      expect(parseEstateStartParam(raw)).toBe(raw);
    }
  });

  it("legacy prop_* params are rejected for every estate (never remapped)", () => {
    for (const estate of CANONICAL) {
      const retired = RETIRED_ESTATE_NAMES[estate.propertyId]!;
      const legacyParam = `${OLD_PROP_PARAM_PREFIX}${retired.slug}`;
      expect(parseEstateStartParam(legacyParam)).toBeNull();
      expect(parseEstateStartParam(`${OLD_PROP_PREFIX}${retired.slug}`)).toBeNull();
    }
  });

  it("utm suffix never breaks canonical resolution", () => {
    for (const estate of CANONICAL) {
      const raw = estate.propertyId;
      expect(parseEstateStartParam(`${raw}~utm_site`)).toBe(raw);
    }
  });
});

describe("no old name / slug / prop-* string leaks into canonical surfaces", () => {
  it("marketplace view model text never contains a retired name or old slug", () => {
    for (const p of PROPERTIES) {
      const vm = toMarketplaceEstate(toCanonicalListing(p));
      const retired = RETIRED_ESTATE_NAMES[p.id]!;
      const visibleText = `${vm.name} ${vm.location} ${vm.description} ${vm.nightlyDisplay ?? ""}`;
      expect(visibleText, p.id).not.toContain(retired.name);
      expect(visibleText, p.id).not.toContain(retired.slug);
      expect(visibleText, p.id).not.toContain(OLD_PROP_PREFIX);
    }
  });

  it("no retired name survives anywhere in the canonical identity layers", () => {
    for (const p of PROPERTIES) {
      const canonical = getCanonicalEstate(p.id)!;
      const retired = RETIRED_ESTATE_NAMES[p.id]!;
      const identityText = [
        canonical.name.value,
        canonical.location.value,
        canonical.observedRentalRate.display,
        ...canonical.images.urls,
      ].join(" ");
      expect(identityText, p.id).not.toContain(retired.name);
      expect(identityText, p.id).not.toContain(retired.slug);
      expect(identityText, p.id).not.toContain(OLD_PROP_PREFIX);
    }
  });

  it("canonical names collide with no retired name (full disconnection)", () => {
    const allRetiredNames = Object.values(RETIRED_ESTATE_NAMES).map((r) => r.name);
    for (const estate of CANONICAL) {
      expect(allRetiredNames, estate.propertyId).not.toContain(estate.name.value);
      expect(estate.name.value, estate.propertyId).not.toMatch(/\bprop-\b/);
    }
  });
});
