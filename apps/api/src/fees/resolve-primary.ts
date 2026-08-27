// File responsibility: primary-market commission (approved FractionalLuxe model).
// The property Commission Card is the authoritative per-property rate when it exists;
// until Commission Card data is provided the existing amount-based tier table
// (buyPrimaryBps) is the fallback. Never guess a rate and never merge the flat
// instant-sell fee (7%) or withdrawal fee (1%) into this logic.
import type { FeeTierRecord } from "./fee-tier-store.js";
import { resolveFee } from "./resolve-fee.js";

export type PrimaryCommissionInput = {
  /** Commission Card rate in basis points when the property has one; null = no card → tier fallback. */
  propertyCardBps: number | null;
  tiers: FeeTierRecord[];
  /** Principal (quantity × share price), integer cents. */
  principalUsd: number;
};

export type PrimaryCommission = {
  /** Basis points actually applied. */
  bps: number;
  /** Integer cents, floor-rounded. */
  feeUsd: number;
  principalUsd: number;
  /** What the buyer pays: principal + commission. */
  totalPayableUsd: number;
  source: "card" | "tier";
};

/**
 * Resolve the primary-market commission for a buy. The Commission Card wins when
 * present; otherwise the tier table's buy_primary rate applies to the principal.
 * Returns null when no tier covers the amount (never silently charge $0).
 */
export function resolvePrimaryCommission(
  input: PrimaryCommissionInput,
): PrimaryCommission | null {
  if (input.propertyCardBps != null) {
    const bps = input.propertyCardBps;
    const feeUsd = Math.floor((input.principalUsd * bps) / 10_000);
    return {
      bps,
      feeUsd,
      principalUsd: input.principalUsd,
      totalPayableUsd: input.principalUsd + feeUsd,
      source: "card",
    };
  }
  const quote = resolveFee(input.tiers, input.principalUsd, "buy_primary");
  if (!quote) return null;
  return {
    bps: quote.bps,
    feeUsd: quote.feeUsd,
    principalUsd: input.principalUsd,
    totalPayableUsd: quote.totalUsd,
    source: "tier",
  };
}
