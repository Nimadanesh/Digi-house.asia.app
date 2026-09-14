// File responsibility: user holdings + per-holding payout constants consumed by earnings/distributions.
import type { Holding } from "@/types/position";

// Notional FX rate for MVP seed math: 1 TON = $2.00 (200 minor). nanoTON per minor cent = 1e9 / 200.
export const NANO_PER_USD_MINOR = 5_000_000;

// Larger demo portfolio (wow numbers) while preserving integrity.
// Canonical ownership (Final PO Decisions 1–2): $100 base cost, value at $100,
// ratios against the canonical V1 supply (re-108924→Syrene $12M = 120,000 shares;
// re-123861→Villa du Cap $25M = 250,000 shares).
// Pending amounts are weekly-settlement tape (next transfer batch), always
// labeled monthly via the ×52/12 presentation conversion at render.
export const HOLDINGS: Holding[] = [
  {
    propertyId: "re-108924",
    sharesOwned: 160,
    avgCostUsd: 10000,
    currentValueUsd: 160 * 10000,
    pendingWeekEarningsUsd: 29424,
    shareRatio: 160 / 120000,
  },
  {
    propertyId: "re-123861",
    sharesOwned: 200,
    avgCostUsd: 10000,
    currentValueUsd: 200 * 10000,
    pendingWeekEarningsUsd: 30923,
    shareRatio: 200 / 250000,
  },
];

export const PAYOUT_SYRENE = 29424;
export const PAYOUT_VILLA_DU_CAP = 30923;
export const TON_SYRENE = PAYOUT_SYRENE * NANO_PER_USD_MINOR;
export const TON_VILLA_DU_CAP = PAYOUT_VILLA_DU_CAP * NANO_PER_USD_MINOR;

// ISO Mondays spanning >=4 distinct weeks, most recent = 2026-07-20.
export const WEEKS = [
  "2026-06-29T00:00:00Z",
  "2026-07-06T00:00:00Z",
  "2026-07-13T00:00:00Z",
  "2026-07-20T00:00:00Z",
];
