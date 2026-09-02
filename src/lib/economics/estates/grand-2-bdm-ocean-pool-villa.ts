// File responsibility: canonical Estate seed fixture (Phase 9 Slice A §7).
// Grand 2 BDM Ocean Pool Villa, JOALI Being — Bodufushi, Raa Atoll, Maldives.
//
// These values are the FIXED canonical product-design assumptions for this rebuild
// (Slice A §7 — do not debate, replace, or "correct" them here):
//   propertyValue        $8,000,000
//   nightly rental rate  $67,000 – $80,000
//   occupancy            60% – 90%
//   gross annual revenue $16,000,000 – $24,000,000 (validation band for the model)
//
// Provenance: the values are company product-design assumptions, not observed market
// facts, so they are classified "estimated" (Slice A §10 example). `grossAnnualRevenue`
// on the asset is "calculated" — it is computed by the canonical economic layer at the
// baseline scenario and must always equal `computeBaselineEstateEconomics(...)` output
// (asserted by tests).
//
// NOT defined by the product yet (represented as unknown, never guessed — Slice A §2.1):
//   averageOccupiedGuests → green tax is reported unknown at baseline; net profit is
//   flagged `netProfitKnown: false` until the product defines guest counts.
//
// Identity note: `id` is a canonical-estate identifier in the rebuild namespace. It is
// deliberately NOT one of the 24 manifest `propertyId`s (cross-repo trading contract);
// canonical-estate ↔ trading-listing linkage is a later-slice concern.

import type { Estate } from "@/types/estate";
import { computeBaselineEstateEconomics } from "../estate-economics";

/** JOALI Being gallery (33 photos already shipped in `public/images/properties/`). */
const JOALI_BEING_IMAGES = Array.from(
  { length: 33 },
  (_, i) => `/images/properties/joali-being-${String(i + 1).padStart(2, "0")}.jpg`,
);

/** Baseline scenario: ADR = nightly-range midpoint ($73,500); occupancy = range midpoint (75%). */
const BASELINE_ADR_USD = 7_350_000; // cents — (67,000 + 80,000) / 2 × 100, provenance "estimated"
const BASELINE_OCCUPANCY = 0.75; // (0.60 + 0.90) / 2

export const GRAND_2_BDM_OCEAN_POOL_VILLA: Estate = {
  id: "estate-grand-2-bdm-ocean-pool-villa",
  name: "Grand 2 BDM Ocean Pool Villa",
  location: "Bodufushi, Raa Atoll, Maldives",
  images: JOALI_BEING_IMAGES,
  asset: {
    propertyValue: { value: 800_000_000, provenance: "estimated" }, // $8,000,000
    currency: "USD",
    nightlyRateMin: { value: 6_700_000, provenance: "estimated" }, // $67,000
    nightlyRateMax: { value: 8_000_000, provenance: "estimated" }, // $80,000
    adrUsd: { value: BASELINE_ADR_USD, provenance: "estimated" }, // explicit per Slice A §9
    occupancyRateMin: { value: 0.6, provenance: "estimated" },
    occupancyRateMax: { value: 0.9, provenance: "estimated" },
    // Calculated gross revenue is assigned below, from the canonical layer itself.
    grossAnnualRevenue: { value: 0, provenance: "calculated" },
  },
  baselineScenario: {
    adrUsd: { value: BASELINE_ADR_USD, provenance: "estimated" },
    occupancyRate: BASELINE_OCCUPANCY,
    // Product decision pending (Slice A §4): guests per occupied night ≠ capacity and
    // no product value exists → unknown, never guessed.
    averageOccupiedGuests: null,
  },
};

// Self-consistency: the asset's calculated gross revenue comes from the canonical layer
// evaluated at the estate's own baseline scenario (single source of computation).
GRAND_2_BDM_OCEAN_POOL_VILLA.asset.grossAnnualRevenue = {
  value: computeBaselineEstateEconomics(GRAND_2_BDM_OCEAN_POOL_VILLA).revenue
    .grossAnnualRevenueUsd,
  provenance: "calculated",
};

/** All canonical estates (grows slice by slice; Slice A ships exactly one). */
export const CANONICAL_ESTATES: readonly Estate[] = [GRAND_2_BDM_OCEAN_POOL_VILLA] as const;
