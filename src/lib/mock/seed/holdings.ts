// File responsibility: user holdings + per-holding payout constants consumed by earnings/distributions.
import type { Holding } from "@/types/position";

// Notional FX rate for MVP seed math: 1 TON = $2.00 (200 minor). nanoTON per minor cent = 1e9 / 200.
export const NANO_PER_USD_MINOR = 5_000_000;

// Two holdings, each referencing one of the funded properties.
export const HOLDINGS: Holding[] = [
  {
    propertyId: "prop-bayside-marina-penthouse",
    sharesOwned: 60,
    avgCostUsd: 25000,
    currentValueUsd: 60 * 26000, // ~+4% unrealized (market value > cost basis)
    pendingWeekEarningsUsd: 1500,
    shareRatio: 0.075,
  },
  {
    propertyId: "prop-alfama-terrace-flat",
    sharesOwned: 75,
    avgCostUsd: 10000,
    currentValueUsd: 75 * 10500, // ~+5% unrealized (market value > cost basis)
    pendingWeekEarningsUsd: 1875,
    shareRatio: 0.075,
  },
];

// Weekly payout (minor units) per holding: (annualRentUsd / 52) * shareRatio.
export const PAYOUT_BAYSIDE = 1500; // 20000 pool * 0.075
export const PAYOUT_ALFAMA = 1875; // 25000 pool * 0.075
export const TON_BAYSIDE = PAYOUT_BAYSIDE * NANO_PER_USD_MINOR;
export const TON_ALFAMA = PAYOUT_ALFAMA * NANO_PER_USD_MINOR;

// ISO Mondays spanning >=4 distinct weeks, most recent = 2026-07-20.
export const WEEKS = [
  "2026-06-29T00:00:00Z",
  "2026-07-06T00:00:00Z",
  "2026-07-13T00:00:00Z",
  "2026-07-20T00:00:00Z",
];