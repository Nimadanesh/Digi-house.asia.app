// File responsibility: Private Club membership selector — pure derivation of the
// displayed tier from the existing portfolio invested total. UI only; no writes,
// no financial math, no connection to economics. Consumes CLUB_TIERS only.
import { CLUB_TIERS, type ClubTierId } from "./club-tiers";

export interface ClubStatus {
  tierId: ClubTierId;
  nextTierId: ClubTierId | null;
  /** Cents remaining to the next tier; null when already at the top tier. */
  toNextUsdCents: number | null;
}

/**
 * Derive the displayed Club membership from the invested total (integer minor
 * units, as stored on PortfolioSummary.totalInvestedUsd). Negative input is
 * clamped to zero. Thresholds are the UI prototype table in club-tiers.ts.
 */
export function getClubStatus(investedUsdCents: number): ClubStatus {
  const invested = Math.max(0, Math.floor(investedUsdCents));
  let index = 0;
  for (let i = 0; i < CLUB_TIERS.length; i++) {
    if (invested >= CLUB_TIERS[i]!.minUsdCents) index = i;
  }
  const tier = CLUB_TIERS[index]!;
  const next = CLUB_TIERS[index + 1] ?? null;
  return {
    tierId: tier.id,
    nextTierId: next?.id ?? null,
    toNextUsdCents: next ? next.minUsdCents - invested : null,
  };
}
