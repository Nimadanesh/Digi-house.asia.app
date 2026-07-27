// File responsibility: shared latency helper to mimic mobile-network delays (kept short for UX).
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
/** Default mock latency — short enough that pages feel instant in Telegram. */
export const jitter = (lo = 40, hi = 120) => Math.floor(lo + Math.random() * (hi - lo));
