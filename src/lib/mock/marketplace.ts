// File responsibility: MarketplaceRepo mock impl.
//
// Migration-compatibility boundary (Final PO Decisions 1, 2, 6): every listing
// returned here is canonicalized via toCanonicalListing — Tier-1 identity +
// V1 supply ($100 base) + demo-ledger sold/remaining. The fixture seed itself is
// never mutated, so isolated tests importing PROPERTIES keep fixture values.
// See ../mock/canonical-listing.ts + PRODUCT-DECISION-LOCK.md §6.
import type { MarketplaceRepo } from "@/lib/api/repos";
import type { PropertyStatus } from "@/types/property";
import { seed } from "./seed";
import { toCanonicalListing } from "./canonical-listing";
import { sleep, jitter } from "./sleep";

export function MockMarketplaceRepo(): MarketplaceRepo {
  return {
    async list(filter?: { status?: PropertyStatus; query?: string }) {
      await sleep(jitter());
      let r = seed.properties.map(toCanonicalListing);
      if (filter?.status) r = r.filter((p) => p.status === filter.status);
      if (filter?.query) {
        const q = filter.query.toLowerCase();
        r = r.filter(
          (p) => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q),
        );
      }
      return r;
    },
    async get(propertyId: string) {
      await sleep(jitter());
      const p = seed.properties.find((x) => x.id === propertyId);
      if (!p) throw new Error("property not found");
      return toCanonicalListing(p);
    },
  };
}