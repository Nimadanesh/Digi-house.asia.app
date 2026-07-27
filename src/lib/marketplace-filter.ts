// File responsibility: pure client-side marketplace filter + sort (no React).
import type { Listing } from "@/types/property";
import { annualYieldRatio } from "@/lib/format";

export type MarketplaceChip = "all" | "highest_yield" | "new" | "almost_sold" | "low_price";

export const MARKETPLACE_CHIPS: readonly { id: MarketplaceChip; label: string }[] = [
  { id: "all", label: "All" },
  { id: "highest_yield", label: "Highest Yield" },
  { id: "new", label: "New" },
  { id: "almost_sold", label: "Almost Sold" },
  { id: "low_price", label: "Low Price" },
] as const;

function apyOf(l: Listing): number {
  return annualYieldRatio(l.annualRentUsd, l.sharePriceUsd * l.totalShares);
}

function createdMs(l: Listing): number {
  return new Date(l.createdAt).getTime();
}

/** Filter by free-text query (title / location), then apply chip sort/filter. */
export function filterMarketplaceListings(
  listings: Listing[],
  opts: { query?: string; chip?: MarketplaceChip } = {},
): Listing[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  const chip = opts.chip ?? "all";

  let next = listings.slice();
  if (q) {
    next = next.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q),
    );
  }

  switch (chip) {
    case "highest_yield":
      return next.sort((a, b) => apyOf(b) - apyOf(a));
    case "new":
      return next.sort((a, b) => createdMs(b) - createdMs(a));
    case "almost_sold":
      return next
        .filter((l) => l.status === "funding" && l.fundingProgressRatio >= 0.5 && l.sharesRemaining > 0)
        .sort((a, b) => b.fundingProgressRatio - a.fundingProgressRatio);
    case "low_price":
      return next.sort((a, b) => a.sharePriceUsd - b.sharePriceUsd);
    case "all":
    default:
      return next;
  }
}

export type CardStatusBadge = { kind: "new" | "sold_pct" | "hot"; label: string };

/**
 * Left-image badge: New (recent), scarcity % Sold when progressive, Hot when mid-scramble funding.
 * `nowMs` injected for purity/tests.
 */
export function listingStatusBadge(listing: Listing, nowMs: number): CardStatusBadge {
  const ageMs = nowMs - new Date(listing.createdAt).getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (ageMs >= 0 && ageMs <= thirtyDays) {
    return { kind: "new", label: "New" };
  }
  if (listing.status === "funding" && listing.fundingProgressRatio >= 0.8 && listing.sharesRemaining > 0) {
    const soldPct = Math.round(listing.fundingProgressRatio * 100);
    return { kind: "sold_pct", label: `${soldPct}% Sold` };
  }
  if (
    listing.status === "funding" &&
    listing.fundingProgressRatio >= 0.45 &&
    listing.fundingProgressRatio < 0.8 &&
    listing.sharesRemaining > 0
  ) {
    return { kind: "hot", label: "Hot" };
  }
  if (listing.fundingProgressRatio > 0) {
    const soldPct = Math.round(listing.fundingProgressRatio * 100);
    return { kind: "sold_pct", label: `${soldPct}% Sold` };
  }
  return { kind: "new", label: "New" };
}
