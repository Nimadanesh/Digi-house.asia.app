/** Instant sell result (PRODUCT-PLAN §0.3). Money: integer cents. */
export interface InstantSellResult {
  id: string;
  propertyId: string;
  shares: number;
  grossUsd: number;
  feeUsd: number;
  netUsd: number;
  status: "settled";
  sharesRemaining: number;
  freeSharesAfter: number;
}

/** Flat instant-sell fee — 7% (§0.5), mirroring the API constant. */
export const INSTANT_SELL_FEE_BPS = 700;
