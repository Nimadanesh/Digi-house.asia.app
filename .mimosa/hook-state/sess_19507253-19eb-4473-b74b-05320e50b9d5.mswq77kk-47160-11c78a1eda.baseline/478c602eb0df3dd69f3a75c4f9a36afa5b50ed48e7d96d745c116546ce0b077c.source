// File responsibility: pure picker for Home “Featured / Hot this week” card.
import type { Listing } from "@/types/property";
import { annualYieldRatio } from "@/lib/format";

function apy(l: Listing): number {
  return annualYieldRatio(l.annualRentUsd, l.sharePriceUsd * l.totalShares);
}

/** Funding listings first by APY then scarcity; else highest APY overall. */
export function pickFeaturedListing(listings: Listing[]): Listing | null {
  if (listings.length === 0) return null;
  const open = listings.filter((l) => l.status === "funding" && l.sharesRemaining > 0);
  const pool = open.length > 0 ? open : listings.slice();
  return pool.slice().sort((a, b) => {
    const apyDelta = apy(b) - apy(a);
    if (apyDelta !== 0) return apyDelta;
    return b.fundingProgressRatio - a.fundingProgressRatio;
  })[0] ?? null;
}
