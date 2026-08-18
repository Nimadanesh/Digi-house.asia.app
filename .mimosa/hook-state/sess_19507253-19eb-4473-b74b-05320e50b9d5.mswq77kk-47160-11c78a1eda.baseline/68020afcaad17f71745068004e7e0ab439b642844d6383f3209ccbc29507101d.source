// File responsibility: MarketplaceRepo mock impl.
import type { MarketplaceRepo } from "@/lib/api/repos";
import type { PropertyStatus } from "@/types/property";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";

export function MockMarketplaceRepo(): MarketplaceRepo {
  return {
    async list(filter?: { status?: PropertyStatus; query?: string }) {
      await sleep(jitter());
      let r = [...seed.properties];
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
      return p;
    },
  };
}