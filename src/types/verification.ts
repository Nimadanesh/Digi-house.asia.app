/**
 * Estate verification foundation (PHASE-9-IMPLEMENTATION-CONTRACT Slice 1; UI Mapping §10).
 *
 * Models verification as an explicit, honest state. Unknown/unverified resolves to
 * `unverified` with no date — the UI must render NO verification badge in that case
 * rather than a fabricated check. Dates exist only when a real source provides them.
 */
import type { Listing } from "@/types/property";

export type VerificationStatus = "verified" | "pending" | "unverified";

/** Verification snapshot for a single estate. */
export interface EstateVerification {
  status: VerificationStatus;
  /** ISO date (YYYY-MM-DD) of the last successful verification; null when never verified. */
  lastVerifiedAt: string | null;
  /** Optional pointer to the source of verification (e.g., doc ID or audit record). */
  source?: string;
}

/** Helper: a Listing with optional verification attached (additive, non-breaking). */
export type VerifiedListing = Listing & { verification?: EstateVerification };

/** Type guard: only `verified` estates may show a verification badge. */
export function isVerified(v: EstateVerification | undefined | null): v is EstateVerification & {
  status: "verified";
  lastVerifiedAt: string;
} {
  return !!v && v.status === "verified" && typeof v.lastVerifiedAt === "string";
}
