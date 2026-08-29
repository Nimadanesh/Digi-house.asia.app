// File responsibility: shared deterministic analytics datasets for the Property
// redesign (REDESIGN-SPEC Phase 4 — Analytics Data Foundation). Pure display-data
// generators + selectors: seeded, internally consistent, replaceable with real
// API data later. No chart UI, no financial/settlement/ownership/yield logic —
// the datasets only ever READ existing listing fields and never mutate anything.
//
// Coherence rules enforced here (and asserted in property-analytics.test.ts):
// - One dataset per property per horizon; every chart phase (5–7) consumes it.
// - Secondary price series ends EXACTLY at getCurrentSharePrice() (lib/property-price).
// - Primary has NO price series and NO price volatility: the offering price is fixed.
// - Holder totals === totalShares; weights sum to 1; history ends at current state.
// - Ownership-history end state === current holders; funding history ends at
//   sharesSold; income history is anchored to annualRentUsd (per-share cents).
// - Measured, real-estate-like variation (weekly steps, bounded drift) — never
//   crypto-like volatility.
import type { Listing } from "@/types/property";
import { getCurrentSharePrice } from "@/lib/property-price";
import { annualYieldRatio } from "@/lib/format";

// ── Deterministic PRNG (same spirit as lib/performance-series: FNV-1a + mulberry32) ──

/** FNV-1a-ish string hash → 32-bit int (stable across renders/sessions). */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 PRNG → [0,1). Deterministic per seed. */
function prng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Types ──

/** One weekly market observation. `at` = ISO timestamp of the week's end. */
export interface PricePoint {
  at: string;
  priceUsd: number;
  /** Whole-week traded shares (all market participants, display data). */
  volumeShares: number;
}

/** Weekly OHLC bar for a future candlestick chart. */
export interface OhlcBar {
  at: string;
  openUsd: number;
  highUsd: number;
  lowUsd: number;
  closeUsd: number;
  volumeShares: number;
}

/** A historical secondary-market fill (display data; distinct from live mock trades). */
export interface HistoricalTrade {
  id: string;
  at: string;
  side: "buy" | "sell";
  priceUsd: number;
  quantity: number;
}

/** One anonymized holder bucket. Shares sum to the property's totalShares. */
export interface HolderBucket {
  /** Privacy-safe label key; locales render e.g. "Holder A". */
  label: string;
  shares: number;
  /** shares / totalShares (basis points, integer; Σ = 10_000). */
  weightBps: number;
}

/** One ownership-distribution observation (weekly). */
export interface OwnershipPoint {
  at: string;
  /** Holder buckets at this date; Σ shares === totalShares. */
  buckets: HolderBucket[];
  holderCount: number;
}

/** One funding observation for Primary (weekly). */
export interface FundingPoint {
  at: string;
  sharesSold: number;
  /** sharesSold / totalShares (0..1). */
  progressRatio: number;
}

/** One monthly income observation (per-share, minor units/cents). */
export interface IncomePoint {
  /** Month key "YYYY-MM" (payout month). */
  month: string;
  /** Payout date, ISO (first payout day of that month, mirrors seed rhythm). */
  paidAt: string;
  /** Per-share payout for the month, minor units (cents). */
  perShareUsd: number;
  /** Whole-pool distribution for the month, minor units (cents). */
  poolUsd: number;
}

/** Compact real-estate metrics derived ONLY from existing listing fields. */
export interface PropertyMetrics {
  /** Whole-property value, minor units (existing field). */
  totalValueUsd: number;
  /** Annual rent pool, minor units (existing field). */
  annualRentUsd: number;
  /** annualRentUsd / totalValueUsd (existing helper). */
  grossYieldRatio: number;
  /** monthlyYieldRate × 12 (existing field). */
  annualYieldRatePct: number;
  /** Implied value per share at the current price, minor units. */
  valuePerShareUsd: number;
  /** Total shares (existing field). */
  totalShares: number;
  /** Shares sold (existing field). */
  sharesSold: number;
}

export interface PropertyAnalytics {
  propertyId: string;
  /** Status at generation time (Primary vs Secondary branching). */
  status: Listing["status"];
  /** 12 months of weekly price+volume — Secondary ONLY (null for Primary). */
  priceHistory: PricePoint[] | null;
  /** Weekly OHLC derived from the same walk — Secondary ONLY. */
  ohlc: OhlcBar[] | null;
  /** Historical fills sampled from the price walk — Secondary ONLY (null for Primary). */
  trades: HistoricalTrade[] | null;
  /** Current holder distribution (Σ shares === totalShares). */
  holders: HolderBucket[];
  /** 12 months of weekly ownership history ending at the current distribution. */
  ownershipHistory: OwnershipPoint[];
  /** 12 months of weekly funding history — Primary ONLY (null for Secondary). */
  fundingHistory: FundingPoint[] | null;
  /** 12 months of monthly income history (per-share cents + pool). */
  incomeHistory: IncomePoint[];
  /** Metrics derived only from existing listing fields. */
  metrics: PropertyMetrics;
}

// ── Constants ──

/** Weeks of market history (≈ 12 months, Phase 4 requirement: prefer 12). */
const HISTORY_WEEKS = 52;
/** Weeks of ownership history (same horizon). */
const OWNERSHIP_WEEKS = 52;
/** Months of income history. */
const INCOME_MONTHS = 12;
/** Trade sampling stride over the price walk (≈2 fills/month → ~24 trades). */
const TRADE_STRIDE = 2;

// ── Small helpers ──

function isoWeeksAgo(nowMs: number, weeks: number): string {
  return new Date(nowMs - weeks * 7 * 24 * 60 * 60 * 1000).toISOString();
}

/** First "payout day" of a month, mirroring the seed's early-month rhythm. */
function monthPayoutAt(year: number, monthIndex: number): string {
  return new Date(Date.UTC(year, monthIndex, 2)).toISOString();
}

/**
 * Backwards random walk in relative terms ending at 1.0 (the anchor), then
 * rescaled so the final point === anchor exactly. Bounded weekly drift keeps the
 * series measured (real-estate-like), never crypto-like.
 */
function relativeWalk(rand: () => number, weeks: number, maxWeeklyDrift: number): number[] {
  const rel: number[] = [1];
  for (let i = 1; i < weeks; i++) {
    const drift = (rand() - 0.5) * 2 * maxWeeklyDrift + Math.sin(i / 7) * 0.004;
    // Hard band keeps the year inside a believable real-estate envelope.
    rel.push(Math.min(1.2, Math.max(0.8, rel[i - 1] / (1 + drift))));
  }
  const scale = 1 / rel[0];
  return rel.map((r) => r * scale);
}

// ── Generators ──

/**
 * 52-week secondary price+volume history ending EXACTLY at the current share
 * price (lib/property-price hierarchy: bestAsk ?? lastTrade ?? list).
 */
function buildPriceHistory(
  listing: Listing,
  anchorUsd: number,
  nowMs: number,
): { priceHistory: PricePoint[]; ohlc: OhlcBar[] } {
  const rand = prng(hashSeed(`pa:price:${listing.id}`));
  const rel = relativeWalk(rand, HISTORY_WEEKS, 0.012);

  const priceHistory: PricePoint[] = [];
  const ohlc: OhlcBar[] = [];
  for (let i = HISTORY_WEEKS - 1; i >= 0; i--) {
    const at = isoWeeksAgo(nowMs, i);
    const closeUsd = Math.round(anchorUsd * rel[i]);
    // Intra-week band around the close — bounded, deterministic.
    const band = Math.max(1, Math.round(closeUsd * 0.006));
    const openUsd =
      i === HISTORY_WEEKS - 1
        ? closeUsd - Math.round(rand() * band)
        : priceHistory[priceHistory.length - 1]!.priceUsd;
    // Band brackets BOTH open and close so every candle brackets its range.
    const highUsd = Math.max(openUsd, closeUsd) + Math.round(rand() * band);
    const lowUsd = Math.min(openUsd, closeUsd) - Math.round(rand() * band);
    const volumeShares = 5 + Math.round(rand() * 60);

    priceHistory.push({ at, priceUsd: closeUsd, volumeShares });
    ohlc.push({ at, openUsd, highUsd, lowUsd, closeUsd, volumeShares });
  }
  return { priceHistory, ohlc };
}

/** ~24 historical fills sampled from the same walk (2 per month-ish). */
function buildTrades(listing: Listing, priceHistory: PricePoint[]): HistoricalTrade[] {
  const rand = prng(hashSeed(`pa:trades:${listing.id}`));
  const trades: HistoricalTrade[] = [];
  for (let i = priceHistory.length - 1; i >= 0; i -= TRADE_STRIDE) {
    const point = priceHistory[i]!;
    trades.push({
      id: `htrd-${listing.id}-${i}`,
      at: point.at,
      side: rand() < 0.5 ? "buy" : "sell",
      priceUsd: point.priceUsd,
      quantity: 1 + Math.floor(rand() * 12),
    });
  }
  return trades;
}

/**
 * Current holder distribution: HOLDER_BUCKETS buckets whose shares sum exactly
 * to totalShares; weights are integer basis points summing to exactly 10_000.
 */
function buildHolders(listing: Listing): HolderBucket[] {
  const rand = prng(hashSeed(`pa:holders:${listing.id}`));
  const total = listing.totalShares;

  // Concentration profile: a dominant whale → a long tail. Deterministic per property.
  const rawWeights = [0.34, 0.22, 0.14, 0.1, 0.07, 0.05].map(
    (w) => w * (0.8 + rand() * 0.4),
  );
  const rawSum = rawWeights.reduce((s, w) => s + w, 0);

  // Integer shares per bucket; the LAST bucket absorbs the rounding remainder so
  // Σ shares === totalShares exactly.
  const shares = rawWeights.map((w) => Math.floor((w / rawSum) * total));
  shares[shares.length - 1] = total - shares.slice(0, -1).reduce((s, v) => s + v, 0);

  // Integer basis points; last bucket absorbs the bps remainder so Σ = 10_000.
  const weights = shares.map((s) => Math.floor((s / total) * 10_000));
  weights[weights.length - 1] = 10_000 - weights.slice(0, -1).reduce((s, v) => s + v, 0);

  return shares.map((s, i) => ({
    label: `holder.${String.fromCharCode(65 + i)}`,
    shares: s,
    weightBps: weights[i]!,
  }));
}

/** Weekly ownership history ending exactly at the current distribution. */
function buildOwnershipHistory(
  listing: Listing,
  holders: HolderBucket[],
  nowMs: number,
): OwnershipPoint[] {
  const rand = prng(hashSeed(`pa:ownhist:${listing.id}`));
  const total = listing.totalShares;
  const points: OwnershipPoint[] = [];

  for (let w = OWNERSHIP_WEEKS - 1; w >= 0; w--) {
    // w = 0 (today) must equal the current distribution exactly — no jitter.
    const jitterScale = w === 0 ? 0 : 1;
    const noise = Array.from({ length: holders.length }, () => (rand() - 0.5) * 0.02 * jitterScale);

    const raw = holders.map((h, i) => Math.max(0.005, h.weightBps / 10_000 + noise[i]!));
    const rawSum = raw.reduce((s, v) => s + v, 0);
    const shares = raw.map((r) => Math.floor((r / rawSum) * total));
    shares[shares.length - 1] = total - shares.slice(0, -1).reduce((s, v) => s + v, 0);

    // Holder count grows to the current value; small deterministic variation.
    const baseCount = 24 + Math.floor(rand() * 30);
    const holderCount = w === 0 ? baseCount : Math.max(6, baseCount - Math.round(w * 0.25));

    const weights = shares.map((s) => Math.floor((s / total) * 10_000));
    weights[weights.length - 1] = 10_000 - weights.slice(0, -1).reduce((s, v) => s + v, 0);

    points.push({
      at: isoWeeksAgo(nowMs, w),
      // Today's point is the current distribution verbatim — re-deriving shares
      // from bps could drift by ±1 share, and the final point must match exactly.
      buckets:
        w === 0
          ? holders.map((h) => ({ ...h }))
          : shares.map((s, i) => ({
              label: holders[i]!.label,
              shares: s,
              weightBps: weights[i]!,
            })),
      holderCount,
    });
  }
  return points;
}

/**
 * Weekly Primary funding history ending exactly at (sharesSold, progressRatio).
 * Pure sales progression — never a price series (Primary price is fixed).
 */
function buildFundingHistory(listing: Listing, nowMs: number): FundingPoint[] {
  const rand = prng(hashSeed(`pa:funding:${listing.id}`));
  const target = listing.sharesSold;
  const points: FundingPoint[] = [];

  // Forward pass: cum[w] = shares sold by the end of week w (w = 0 oldest …
  // W-1 = today). Grows with mild acceleration; monotonic (each week clamped to
  // ≥ the previous) and the final week lands exactly on target.
  const cum: number[] = [0];
  for (let w = 1; w < HISTORY_WEEKS; w++) {
    const progress = w / (HISTORY_WEEKS - 1);
    const ease = progress * progress * (3 - 2 * progress); // smoothstep
    const noise = (rand() - 0.5) * 0.04;
    const candidate = Math.min(target, Math.max(0, Math.floor(target * (ease + noise))));
    cum.push(Math.max(cum[w - 1]!, candidate));
  }
  cum[HISTORY_WEEKS - 1] = target;

  // Points oldest → newest; the final point IS the current funding state.
  // progressRatio mirrors the API's map-listing derivation: sharesSold / totalShares.
  for (let w = 0; w < HISTORY_WEEKS; w++) {
    const sharesSold = cum[w]!;
    points.push({
      at: isoWeeksAgo(nowMs, HISTORY_WEEKS - 1 - w),
      sharesSold,
      progressRatio: listing.totalShares > 0 ? sharesSold / listing.totalShares : 0,
    });
  }
  return points;
}

/**
 * 12 months of monthly income. Anchored to the property's own economics:
 * monthly pool = annualRent / 12 with small deterministic variation, per-share
 * = pool / totalShares. Ends aligned with the current month (seed rhythm).
 */
function buildIncomeHistory(listing: Listing, nowMs: number): IncomePoint[] {
  const rand = prng(hashSeed(`pa:income:${listing.id}`));
  const monthlyPoolBase = Math.floor(listing.annualRentUsd / 12);
  const points: IncomePoint[] = [];

  const end = new Date(nowMs);
  for (let m = INCOME_MONTHS - 1; m >= 0; m--) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - m, 1));
    // Bounded variation around the base pool (±3%) — rent is contractual, not volatile.
    const poolUsd = Math.max(0, Math.round(monthlyPoolBase * (1 + (rand() - 0.5) * 0.06)));
    const perShareUsd = listing.totalShares > 0 ? Math.floor(poolUsd / listing.totalShares) : 0;
    points.push({
      month: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      paidAt: monthPayoutAt(d.getUTCFullYear(), d.getUTCMonth()),
      perShareUsd,
      poolUsd,
    });
  }
  return points;
}

/** Metrics derived ONLY from existing listing fields (nothing fabricated). */
function buildMetrics(listing: Listing, currentPriceUsd: number): PropertyMetrics {
  return {
    totalValueUsd: listing.totalValueUsd,
    annualRentUsd: listing.annualRentUsd,
    grossYieldRatio: annualYieldRatio(listing.annualRentUsd, listing.totalValueUsd),
    annualYieldRatePct: listing.monthlyYieldRate * 12,
    valuePerShareUsd: currentPriceUsd,
    totalShares: listing.totalShares,
    sharesSold: listing.sharesSold,
  };
}

// ── Public API ──

/**
 * The ONE shared analytics dataset for a property. Deterministic for a given
 * (property, day): every chart phase consumes this — never per-chart random data.
 *
 * @param listing existing listing (read-only; never mutated)
 * @param nowMs   generation instant (defaults to Date.now()); datasets are stable
 *                within a day so repeated renders agree.
 * @param book    optional current order book (bestAskUsd) for the price anchor.
 */
export function getPropertyAnalytics(
  listing: Listing,
  nowMs: number = Date.now(),
  book?: { bestAskUsd?: number },
): PropertyAnalytics {
  const isPrimary = listing.status === "funding";
  const currentPriceUsd = getCurrentSharePrice(listing, book);

  const holders = buildHolders(listing);
  const ownershipHistory = buildOwnershipHistory(listing, holders, nowMs);

  // Noise seeds are per-property only (time-invariant); `nowMs` positions the
  // dates. Datasets are therefore fully deterministic per property.
  let priceHistory: PricePoint[] | null = null;
  let ohlc: OhlcBar[] | null = null;
  let trades: HistoricalTrade[] | null = null;
  if (!isPrimary) {
    const market = buildPriceHistory(listing, currentPriceUsd, nowMs);
    priceHistory = market.priceHistory;
    ohlc = market.ohlc;
    trades = buildTrades(listing, priceHistory);
  }

  return {
    propertyId: listing.id,
    status: listing.status,
    priceHistory,
    ohlc,
    trades,
    holders,
    ownershipHistory,
    fundingHistory: isPrimary ? buildFundingHistory(listing, nowMs) : null,
    incomeHistory: buildIncomeHistory(listing, nowMs),
    metrics: buildMetrics(listing, currentPriceUsd),
  };
}

/**
 * Weekly bars → daily OHLC by linear interpolation inside each week (display
 * convenience so a candlestick chart can render finer bars without a new walk).
 */
export function priceToOhlc(points: PricePoint[]): OhlcBar[] {
  const bars: OhlcBar[] = [];
  for (let i = 0; i < points.length; i++) {
    const cur = points[i]!;
    const openUsd = i === 0 ? cur.priceUsd : points[i - 1]!.priceUsd;
    const closeUsd = cur.priceUsd;
    const highUsd = Math.max(openUsd, closeUsd);
    const lowUsd = Math.min(openUsd, closeUsd);
    bars.push({
      at: cur.at,
      openUsd,
      highUsd,
      lowUsd,
      closeUsd,
      volumeShares: cur.volumeShares,
    });
  }
  return bars;
}

/** Timeframe window over a weekly series (Phase 5 will map UI ranges to this). */
export type AnalyticsRange = "1M" | "3M" | "6M" | "1Y" | "ALL";

const RANGE_WEEKS: Record<AnalyticsRange, number> = {
  "1M": 4,
  "3M": 13,
  "6M": 26,
  "1Y": 52,
  ALL: 52,
};

/** Slice a weekly price/ownership series to a UI timeframe (oldest → newest). */
export function sliceRange<T extends { at: string }>(points: T[], range: AnalyticsRange): T[] {
  const weeks = RANGE_WEEKS[range];
  return points.slice(Math.max(0, points.length - weeks));
}
