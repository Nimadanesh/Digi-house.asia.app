/**
 * Owner Stay — P0 foundation (PHASE-9-IMPLEMENTATION-CONTRACT Slice 1; UI Mapping §9).
 *
 * Types + honest unavailable-state stub only. NO availability logic, NO booking,
 * NO calendar, NO nights math, NO fake request IDs or confirmations (contract §5).
 * All data is explicitly marked unavailable until a real source provides it.
 */

export type StayDataAvailability = "available" | "partial" | "unavailable";

/** Why stay data is absent. Drives honest UI copy; never fabricated. */
export type StayUnavailableReason =
  | "not_published" // the estate's stay program has not been published
  | "no_entitlement" // the user holds no qualifying ownership
  | "backend_absent"; // no stay data source exists yet (current state)

export interface OwnerStayEntitlement {
  /** Annual nights granted by the ownership tier, if published. */
  annualNights: number | null;
  /** Nights already used, if tracked. */
  nightsUsed: number | null;
  /** Nights remaining, if computable from real data. */
  nightsRemaining: number | null;
  /** Booking window (e.g., how far in advance bookings may be requested). */
  bookingWindowDays: number | null;
  /** Blackout dates as ISO date strings, if published. */
  blackoutDates: string[] | null;
  /** Minimum stay length in nights, if specified. */
  minStayNights: number | null;
}

/** Per-estate stay info attached to a listing (additive, non-breaking). */
export interface EstateStayInfo {
  availability: StayDataAvailability;
  /** Why data is absent when availability is "unavailable". */
  unavailableReason: StayUnavailableReason | null;
  entitlement: OwnerStayEntitlement;
  /** Optional pointer to the source of the stay data (e.g., policy doc ID). */
  source?: string;
}

/**
 * Builds an honest unavailable snapshot for an estate with no stay data.
 * UI must render NO numbers, NO calendar, and NO bookable CTA in this case.
 */
export function unavailableStay(reason: StayUnavailableReason = "backend_absent"): EstateStayInfo {
  return {
    availability: "unavailable",
    unavailableReason: reason,
    entitlement: {
      annualNights: null,
      nightsUsed: null,
      nightsRemaining: null,
      bookingWindowDays: null,
      blackoutDates: null,
      minStayNights: null,
    },
  };
}
