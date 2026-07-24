// File responsibility: shared latency helper to mimic mobile-network delays.
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
export const jitter = (lo = 250, hi = 700) => Math.floor(lo + Math.random() * (hi - lo));