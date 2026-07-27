// File responsibility: user holdings + per-holding payout constants consumed by earnings/distributions.
import type { Holding } from "@/types/position";

// Notional FX rate for MVP seed math: 1 TON = $2.00 (200 minor). nanoTON per minor cent = 1e9 / 200.
export const NANO_PER_USD_MINOR = 5_000_000;

// Larger demo portfolio (wow numbers) while preserving integrity:
// Bayside 160/800 = 0.2 → weekly floor(1_040_000/52)*0.2 = 4000
// Alfama 200/1000 = 0.2 → weekly floor(1_300_000/52)*0.2 = 5000
export const HOLDINGS: Holding[] = [
  {
    propertyId: "prop-bayside-marina-penthouse",
    sharesOwned: 160,
    avgCostUsd: 25000,
    currentValueUsd: 160 * 26000,
    pendingWeekEarningsUsd: 4000,
    shareRatio: 0.2,
  },
  {
    propertyId: "prop-alfama-terrace-flat",
    sharesOwned: 200,
    avgCostUsd: 10000,
    currentValueUsd: 200 * 10500,
    pendingWeekEarningsUsd: 5000,
    shareRatio: 0.2,
  },
];

export const PAYOUT_BAYSIDE = 4000;
export const PAYOUT_ALFAMA = 5000;
export const TON_BAYSIDE = PAYOUT_BAYSIDE * NANO_PER_USD_MINOR;
export const TON_ALFAMA = PAYOUT_ALFAMA * NANO_PER_USD_MINOR;

// ISO Mondays spanning >=4 distinct weeks, most recent = 2026-07-20.
export const WEEKS = [
  "2026-06-29T00:00:00Z",
  "2026-07-06T00:00:00Z",
  "2026-07-13T00:00:00Z",
  "2026-07-20T00:00:00Z",
];
