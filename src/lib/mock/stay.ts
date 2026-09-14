// File responsibility: Owner Stay MOCK (P0). Implements the read-only StayRepo
// contract with an honest unavailable state — the real backend swaps in via
// lib/api/getRepo.ts later. Presentation-only: no calendar, no booking, no
// availability engine, no fabricated entitlement numbers (contract §5).
import type { StayRepo } from "@/lib/api/repos";
import type { EstateStayInfo } from "@/types/stay";
import { unavailableStay } from "@/types/stay";

export function MockStayRepo(): StayRepo {
  /**
   * Every estate resolves to the same honest snapshot: stay data is not
   * published anywhere yet (backend_absent). No numbers, no calendar, no
   * bookable CTA may be derived from this — the UI renders the unavailable
   * state only.
   */
  return {
    async get(_propertyId: string): Promise<EstateStayInfo> {
      return unavailableStay("backend_absent");
    },
  };
}
