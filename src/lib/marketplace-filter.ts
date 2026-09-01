// File responsibility: pure client-side Estates (/marketplace) filter + sort (no React).
//
// Phase 9 reframe (redesign §6 / UI Mapping §4.3–4.4):
// - Filters are exactly: All / Featured / New / Income / Owner Stay / Resale.
// - Default sort is Curated (stable feed = manifest order), never highest yield.
//
// Data-honesty notes:
// - "Featured" matches nothing and "Owner Stay" matches nothing: no featured flag and
//   no owner-stay entitlement data exist anywhere in the model (Audit 9.0 §10/§14). The
//   UI renders these chips and shows an honest empty state instead of fabricating matches.
// - The "New" window uses the shared demo-tape clock so the filter always agrees with the
//   card's "New" badge (both default to MARKETPLACE_DEMO_CLOCK_MS).
import type { Listing } from "@/types/property";
import { shareWeeklyYieldUsd } from "@/lib/property-yield";

/** Phase 9 Estates filters — exactly these six (redesign §6, UI Mapping §4.3). */
export type EstateFilter =
  | "all"
  | "featured"
  | "new"
  | "income"
  | "owner_stay"
  | "resale";

/** Estates sort options (UI Mapping §4.4). Curated = stable manifest feed order. */
export type EstateSort = "curated" | "income" | "price" | "newest";

/** Filter ids only — labels live in messages via i18n (`estates.chips.*`). */
export const ESTATE_FILTER_IDS: readonly EstateFilter[] = [
  "all",
  "featured",
  "new",
  "income",
  "owner_stay",
  "resale",
] as const;

/** Sort ids only — labels live in messages via i18n (`estates.sort.*`). */
export const ESTATE_SORT_IDS: readonly EstateSort[] = [
  "curated",
  "income",
  "price",
  "newest",
] as const;

/**
 * Shared demo-tape clock used by the "New" badge (PropertyCard) and the "New"
 * filter so both always agree. Tests inject `nowMs` explicitly.
 */
export const MARKETPLACE_DEMO_CLOCK_MS = Date.UTC(2026, 6, 26);

export const NEW_ESTATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

function createdMs(l: Listing): number {
  return new Date(l.createdAt).getTime();
}

/** A rental-income metric is only shown when its source data exists (UI Mapping §4.5). */
export function hasIncomeData(l: Listing): boolean {
  return l.annualRentUsd > 0 && l.monthlyYieldRate > 0 && l.sharePriceUsd > 0;
}

/**
 * Projected per-share monthly income used by the estate card and the "Rental
 * income" sort. Identical figure to the Featured Estate card on Home (slice 3):
 * weekly mock ×52/12 presentation conversion, labeled a projection, formatted
 * by usd() at render. Returns 0 (never a fabricated number) without data.
 */
export function projectedMonthlyIncomeUsd(l: Listing): number {
  if (!hasIncomeData(l)) return 0;
  return (shareWeeklyYieldUsd(l) * 52) / 12;
}

/**
 * Filter by free-text query (title / location / description), then apply the
 * Phase 9 filter, then the sort. Curated keeps the stable feed (manifest) order.
 */
export function filterEstates(
  listings: Listing[],
  opts: {
    query?: string;
    filter?: EstateFilter;
    sort?: EstateSort;
    /** Epoch ms for the "New" window (inject in tests; defaults to demo clock). */
    nowMs?: number;
  } = {},
): Listing[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  const filter = opts.filter ?? "all";
  const sort = opts.sort ?? "curated";
  const now = opts.nowMs ?? MARKETPLACE_DEMO_CLOCK_MS;

  let next = listings.slice();
  if (q) {
    next = next.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.location.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q),
    );
  }

  switch (filter) {
    case "featured":
      // No editorial featured flag exists in the model — honest empty set
      // (the UI surfaces "Featured curation is not available yet").
      return [];
    case "new":
      return next.filter(
        (l) => now - createdMs(l) >= 0 && now - createdMs(l) <= NEW_ESTATE_WINDOW_MS,
      );
    case "income":
      // Estates whose rental-income metric is actually available; estates
      // without data are excluded, never shown with a fabricated number.
      return next.filter(hasIncomeData);
    case "owner_stay":
      // No owner-stay entitlement data exists — honest empty set
      // (the UI surfaces "Owner Stay data is not available yet").
      return [];
    case "resale":
      // Preserve the pre-existing secondary semantics: funded = legacy sold-out
      // with the resale book open, resale = live co-owner offers.
      return next.filter((l) => l.status === "resale" || l.status === "funded");
    case "all":
    default:
      break;
  }

  switch (sort) {
    case "income": {
      const rank = (l: Listing) => (hasIncomeData(l) ? 1 : 0);
      return next.sort(
        (a, b) =>
          rank(b) - rank(a) ||
          projectedMonthlyIncomeUsd(b) - projectedMonthlyIncomeUsd(a),
      );
    }
    case "price":
      return next.sort((a, b) => a.sharePriceUsd - b.sharePriceUsd);
    case "newest":
      return next.sort((a, b) => createdMs(b) - createdMs(a));
    case "curated":
    default:
      // Stable manifest/feed order — the only truthful "editorial" order today.
      return next;
  }
}

export type CardStatusBadge = {
  kind: "new" | "sold_pct" | "hot";
  /** English fallback for tests / pure callers; UI should i18n via kind + soldPct. */
  label: string;
  soldPct?: number;
};

/**
 * Left-image badge: New (recent), scarcity % Sold when progressive, Hot when mid-scramble funding.
 * `nowMs` injected for purity/tests. Phase 9 estate cards render only the `new` kind
 * (no scarcity/FOMO badges); the other kinds remain for library/purity callers.
 */
export function listingStatusBadge(listing: Listing, nowMs: number): CardStatusBadge {
  const ageMs = nowMs - new Date(listing.createdAt).getTime();
  if (ageMs >= 0 && ageMs <= NEW_ESTATE_WINDOW_MS) {
    return { kind: "new", label: "New" };
  }
  if (listing.status === "funding" && listing.fundingProgressRatio >= 0.8 && listing.sharesRemaining > 0) {
    const soldPct = Math.round(listing.fundingProgressRatio * 100);
    return { kind: "sold_pct", label: `${soldPct}% Sold`, soldPct };
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
    return { kind: "sold_pct", label: `${soldPct}% Sold`, soldPct };
  }
  return { kind: "new", label: "New" };
}