// File responsibility: Private Club economics v1 — approved business rules as a
// single source of truth plus pure selectors. UI prototype
// thresholds stay in club-tiers.ts; NO booking, lottery execution, ledger,
// settlement, or backend lives here. Money = integer minor units (cents);
// tier weights are probability multipliers (floats by design, never money).
import type { ClubTierId } from "./club-tiers";

/** Approved Club allocation: villa-days/year reserved for the Club. */
export const CLUB_POOL_NIGHTS = 1450;
/** Standard complimentary award length: whole nights only, never fractional. */
export const STANDARD_AWARD_NIGHTS = 4;
/** Eligible members below this count receive direct allocation; above it, lottery. */
export const EARLY_MEMBER_BOUNDARY = 360;
/** Minimum investment (cents) for a referral to count as qualified. */
export const QUALIFYING_INVESTMENT_CENTS = 1_000_000;

/** Normative V1 tier priority weights, locked 2026-09-26 (probability, never deterministic rank). */
export const TIER_WEIGHTS: Record<Exclude<ClubTierId, "standard">, number> = {
  private: 1,
  private_plus: 1.25,
  elite: 1.5,
  signature: 2,
} as const;

/** Expected member mix (assumption, configurable — not a forecast). */
export const EXPECTED_MEMBER_MIX: Record<Exclude<ClubTierId, "standard">, number> = {
  private: 0.6,
  private_plus: 0.25,
  elite: 0.125,
  signature: 0.025,
} as const;

export interface ReferralMilestone {
  referrals: number;
  cumulativePoints: number;
  /** Additional whole nights beyond the 4-night base; capped so total ≤ 7. */
  additionalNights: number;
  unlocksPlusLayer: boolean;
}

/**
 * Approved V1 referral ladder (cumulative). Values are configurable assumptions.
 * Stay mapping: 1→4 nights, 3→5, 5→6, 7→7, 10→7 + Plus Experience Layer.
 */
export const REFERRAL_LADDER: readonly ReferralMilestone[] = [
  { referrals: 1, cumulativePoints: 1, additionalNights: 0, unlocksPlusLayer: false },
  { referrals: 3, cumulativePoints: 4, additionalNights: 1, unlocksPlusLayer: false },
  { referrals: 5, cumulativePoints: 7, additionalNights: 2, unlocksPlusLayer: false },
  { referrals: 7, cumulativePoints: 11, additionalNights: 3, unlocksPlusLayer: false },
  { referrals: 10, cumulativePoints: 16, additionalNights: 3, unlocksPlusLayer: true },
] as const;

/** Absolute ceiling for any referral-enhanced stay: whole nights, never exceeded. */
export const MAX_REFERRAL_STAY_NIGHTS = 7;

/** Peak policy: complimentary stays consume non-peak inventory; peak is paid rental. */
export const PEAK_POLICY = {
  complimentaryFromNonPeak: true,
  peakAwardNights: 3,
  peakDiscountPct: 0,
} as const;

/** Stay timing: complimentary redemption starts ~3 seasons / ≥9 months out. */
export const STAY_TIMING = {
  seasonsDelay: 3,
  minMonthsOut: 9,
} as const;

/** Cancellation: 1–2 month advance preserves the opportunity; no-show forfeits it. No fines. */
export const CANCELLATION_POLICY = {
  advanceNoticeMonths: [1, 2] as const,
  noShowForfeitsOpportunity: true,
  monetaryFines: false,
} as const;

export interface AwardSplit {
  awards: number;
  remainder: number;
}

/** Whole-night awards from pool nights. Remainder never becomes a fractional award. */
export function completeAwards(poolNights: number, awardNights: number): AwardSplit {
  const nights = Math.max(0, Math.floor(poolNights));
  const size = Math.max(1, Math.floor(awardNights));
  return { awards: Math.floor(nights / size), remainder: nights % size };
}

/** Lottery weight for a tier; standard is never eligible (weight 0). */
export function tierWeight(tierId: ClubTierId): number {
  if (tierId === "standard") return 0;
  return TIER_WEIGHTS[tierId];
}

/** Stay/lottery eligibility: PRIVATE and above only. */
export function isStayEligible(tierId: ClubTierId): boolean {
  return tierId !== "standard";
}

/** A referral counts only if the invited member invested ≥ $10K (is Club-eligible). */
export function isQualifiedReferral(investedUsdCents: number): boolean {
  return Math.floor(investedUsdCents) >= QUALIFYING_INVESTMENT_CENTS;
}

export interface ReferralProgress {
  successfulReferrals: number;
  cumulativePoints: number;
  plusLayerUnlocked: boolean;
  /** Next milestone above the current count, or null when the ladder is complete. */
  nextMilestone: ReferralMilestone | null;
}

/** Cumulative referral progression from a count of qualified referrals. */
export function referralProgress(successfulReferrals: number): ReferralProgress {
  const count = Math.max(0, Math.floor(successfulReferrals));
  let reached: ReferralMilestone | null = null;
  for (const milestone of REFERRAL_LADDER) {
    if (count >= milestone.referrals) reached = milestone;
  }
  const nextMilestone = REFERRAL_LADDER.find((m) => m.referrals > count) ?? null;
  return {
    successfulReferrals: count,
    cumulativePoints: reached?.cumulativePoints ?? 0,
    plusLayerUnlocked: reached?.unlocksPlusLayer ?? false,
    nextMilestone,
  };
}

/**
 * Referral-enhanced stay length in whole nights: 4-night base plus the highest
 * reached milestone's additional nights, hard-capped at 7. Never fractional,
 * never above the cap, regardless of count.
 */
export function referralStayNights(successfulReferrals: number): number {
  const count = Math.max(0, Math.floor(successfulReferrals));
  let additional = 0;
  for (const milestone of REFERRAL_LADDER) {
    if (count >= milestone.referrals) additional = milestone.additionalNights;
  }
  return Math.min(STANDARD_AWARD_NIGHTS + additional, MAX_REFERRAL_STAY_NIGHTS);
}

/**
 * Experience-layer tier for display/recognition purposes only. A PRIVATE member
 * with the Plus layer unlocked is recognised at Private Plus EXPERIENCE level
 * while remaining financially classified by actual investment. Every other
 * input maps to itself — financial tiers are never rewritten.
 */
export function resolveExperienceTier(
  financialTierId: ClubTierId,
  plusLayerUnlocked: boolean,
): ClubTierId {
  if (plusLayerUnlocked && financialTierId === "private") return "private_plus";
  return financialTierId;
}

/** Allocation mode: direct while capacity supports it, lottery once oversubscribed. */
export function allocationMode(eligibleMembers: number): "direct" | "lottery" {
  return eligibleMembers <= EARLY_MEMBER_BOUNDARY ? "direct" : "lottery";
}
