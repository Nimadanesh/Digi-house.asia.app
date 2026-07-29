// File responsibility: shared latency helper to mimic mobile-network delays (kept short for UX).
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
/** Default mock latency — near-instant so Telegram WebView feels native. */
export const jitter = (lo = 16, hi = 48) => Math.floor(lo + Math.random() * (hi - lo));
