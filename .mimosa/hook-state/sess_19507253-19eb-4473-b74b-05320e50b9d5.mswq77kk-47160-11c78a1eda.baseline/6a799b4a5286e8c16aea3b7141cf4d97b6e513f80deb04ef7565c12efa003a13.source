// File responsibility: nanoTON ↔ decimal/USD helper math. Wraps @ton/core toNano/fromNano for safety.
// Pure; no React, no network. Money in is cents (integer minor units); TON out is nanoTON (bigint).
import { toNano, fromNano } from "@ton/core";

/** Convert a decimal TON string ("0.01") to nanoTON bigint. Returns 0n on garbage. */
export function toNanoSafe(ton: string): bigint {
  if (!ton || typeof ton !== "string") return 0n;
  const trimmed = ton.trim();
  if (!/^\d*\.?\d+$/.test(trimmed)) return 0n;
  try {
    return toNano(trimmed);
  } catch {
    return 0n;
  }
}

/** Convert nanoTON bigint to a rounded decimal string (default 4 decimals). */
export function fromNanoRound(nano: bigint, decimals = 4): string {
  const s = fromNano(nano); // decimal string like "0.123456789"
  const n = Number(s);
  if (!Number.isFinite(n)) return "0";
  return n.toFixed(decimals);
}

/** Convert nanoTON to USD cents (integer minor units) using a USD-per-TON price. */
export function nanoToUsd(nano: bigint, tonUsdPrice: number): number {
  if (tonUsdPrice <= 0) return 0;
  const ton = Number(fromNano(nano));
  return Math.round(ton * tonUsdPrice * 100);
}

/** Estimate nanoTON for a USD-cents amount at a USD-per-TON price. */
export function usdToNanoEstimate(usdCents: number, tonUsdPrice: number): bigint {
  if (tonUsdPrice <= 0 || usdCents <= 0) return 0n;
  const ton = usdCents / 100 / tonUsdPrice;
  return toNanoSafe(ton.toFixed(9));
}