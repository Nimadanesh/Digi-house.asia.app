// File responsibility: Private Club tier table — UI PROTOTYPE thresholds only.
// These values must NEVER be imported into investment/fee/yield/settlement/
// withdrawal/buy/sell/TON logic. The dependency direction is:
// portfolio data → club-status selector → Club UI. Never the reverse.

export type ClubTierId = "standard" | "private" | "private_plus" | "elite" | "signature";

export interface ClubTier {
  id: ClubTierId;
  /** Minimum invested amount, integer minor units (cents). */
  minUsdCents: number;
  /** i18n key suffix under the `club` namespace (e.g. `club.tier.private`). */
  labelKey: string;
  /** i18n key suffix for the one-line tier description (e.g. `club.tierDescription.private`). */
  descKey: string;
}

/** Ascending by minUsdCents. UI prototype only — not the final economic model. */
export const CLUB_TIERS: readonly ClubTier[] = [
  { id: "standard", minUsdCents: 0, labelKey: "tier.standard", descKey: "tierDescription.standard" },
  { id: "private", minUsdCents: 1_000_000, labelKey: "tier.private", descKey: "tierDescription.private" },
  { id: "private_plus", minUsdCents: 2_500_000, labelKey: "tier.privatePlus", descKey: "tierDescription.privatePlus" },
  { id: "elite", minUsdCents: 10_000_000, labelKey: "tier.elite", descKey: "tierDescription.elite" },
  { id: "signature", minUsdCents: 50_000_000, labelKey: "tier.signature", descKey: "tierDescription.signature" },
] as const;

export type ClubTierState = "past" | "current" | "future";

/** Rank of a tier in the progression (higher index = higher tier). */
const TIER_RANK: Record<ClubTierId, number> = {
  standard: 0,
  private: 1,
  private_plus: 2,
  elite: 3,
  signature: 4,
};

/** Position of `tierId` relative to the member's `currentTierId`. */
export function getClubTierState(tierId: ClubTierId, currentTierId: ClubTierId): ClubTierState {
  if (tierId === currentTierId) return "current";
  return TIER_RANK[tierId]! < TIER_RANK[currentTierId]! ? "past" : "future";
}
