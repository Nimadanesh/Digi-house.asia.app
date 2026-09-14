// Slice F §16: 24-property reconciliation — regression invariant.
// Exactly 24 marketplace estates, 24 unique canonical ids, 24 unique Rental
// Escapes identities, no duplicates, no missing, no legacy, no orphans.
import { describe, expect, it } from "vitest";

import { PROPERTIES } from "@/lib/mock/seed/properties";
import {
  CANONICAL_MARKETPLACE_ESTATES,
  CANONICAL_RECONCILIATION,
} from "@/lib/economics/estates/canonical-24";
import { toMarketplaceEstates } from "@/lib/economics/marketplace-view-model";

describe("Slice F reconciliation: 24-property marketplace invariant", () => {
  it("exactly 24 marketplace estates", () => {
    expect(toMarketplaceEstates(PROPERTIES)).toHaveLength(24);
    expect(CANONICAL_MARKETPLACE_ESTATES).toHaveLength(24);
    expect(CANONICAL_RECONCILIATION).toHaveLength(24);
  });

  it("24 unique canonical ids, no duplicates, no missing, no orphans", () => {
    const vms = toMarketplaceEstates(PROPERTIES);
    const vmIds = new Set(vms.map((v) => v.id));
    const canonicalIds = new Set(CANONICAL_MARKETPLACE_ESTATES.map((e) => e.propertyId));
    expect(vmIds.size).toBe(24);
    expect(canonicalIds.size).toBe(24);
    for (const id of vmIds) {
      expect(canonicalIds.has(id)).toBe(true);
    }
    for (const id of canonicalIds) {
      expect(vmIds.has(id)).toBe(true);
    }
  });

  it("24 unique Rental Escapes identities, no duplicates", () => {
    const vms = toMarketplaceEstates(PROPERTIES);
    const listingIds = vms.map((v) => v.rentalEscapesListingId);
    expect(listingIds.every(Boolean)).toBe(true);
    expect(new Set(listingIds).size).toBe(24);
  });

  it("no legacy inventory leaks into the view model", () => {
    const vms = toMarketplaceEstates(PROPERTIES);
    for (const vm of vms) {
      // The CONFLICTED legacy field must not exist on the view model at all.
      expect("totalValueUsd" in vm).toBe(false);
      expect(vm.estateValue).not.toBeNull();
      expect(vm.estateValue!.value).not.toBe(8_200_000_000);
    }
  });
});
