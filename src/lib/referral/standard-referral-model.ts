// File responsibility: Standard referral reward model (V1 product model) —
// configurable investment bands, reward rates, and the share-lock rule.
// PROTOTYPE + COMPLIANCE-GATED: the investment-linked reward is a proposed
// commercial configuration, not a live financial entitlement. Reward value is
// a purchase credit toward villa shares only (never cash/ROI/yield). No
// ledger, settlement, wallet, or blockchain logic lives here. Money = integer
// minor units (cents); rates = integer basis points; no floating-point math.

export interface StandardReferralBand {
  /** Inclusive lower bound, integer cents. */
  minCents: number;
  /** Inclusive upper bound, integer cents. */
  maxCents: number;
  /** Reward rate in basis points (500 = 5%). */
  rateBps: 500 | 750 | 1000;
}

/** Configurable bands: $0–$9,999 → 5% · $10K–$24,999 → 7.5% · $25K–$99,999 → 10%. */
export const STANDARD_REFERRAL_BANDS: readonly StandardReferralBand[] = [
  { minCents: 0, maxCents: 999_999, rateBps: 500 },
  { minCents: 1_000_000, maxCents: 2_499_999, rateBps: 750 },
  { minCents: 2_500_000, maxCents: 9_999_999, rateBps: 1000 },
] as const;

/** Upper bound of the highest defined band: at/above this the reward is custom. */
export const STANDARD_REFERRAL_CUSTOM_THRESHOLD_CENTS = 10_000_000;

/** Shares bought with referral reward credit follow this lock (months). */
export const REFERRAL_REWARD_SHARE_LOCK_MONTHS = 6;

export type StandardReferralReward =
  | { kind: "reward"; rateBps: 500 | 750 | 1000; rewardCents: number }
  | { kind: "custom" };

/**
 * Reward for an invitee's eventual investment (integer cents in). Returns the
 * band rate + half-up-rounded reward, or `{ kind: "custom" }` at/above $100K
 * (never extrapolates the 10% band). Negative input clamps to zero.
 */
export function getStandardReferralReward(inviteeInvestedCents: number): StandardReferralReward {
  const invested = Math.max(0, Math.floor(inviteeInvestedCents));
  if (invested >= STANDARD_REFERRAL_CUSTOM_THRESHOLD_CENTS) return { kind: "custom" };
  const band = STANDARD_REFERRAL_BANDS.find((b) => invested >= b.minCents && invested <= b.maxCents)
    ?? STANDARD_REFERRAL_BANDS[0]!;
  return {
    kind: "reward",
    rateBps: band.rateBps,
    rewardCents: Math.floor((invested * band.rateBps + 5000) / 10000),
  };
}
