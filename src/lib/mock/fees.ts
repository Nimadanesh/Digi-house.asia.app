// File responsibility: FeesRepo mock impl — the 9-tier product schedule (§0.5), mirroring
// the API's migration 0019 seed so demo numbers equal production numbers.
import type { FeesRepo } from "@/lib/api/repos";
import type { FeeTier } from "@/types/fees";
import { sleep, jitter } from "./sleep";

export const DEFAULT_FEE_TIERS: FeeTier[] = [
  { id: 1, minAmountUsd: 8_000, maxAmountUsd: 50_000, buyPrimaryBps: 300, buySecondaryBps: 90, sellSecondaryBps: 90 },
  { id: 2, minAmountUsd: 50_000, maxAmountUsd: 200_000, buyPrimaryBps: 250, buySecondaryBps: 80, sellSecondaryBps: 80 },
  { id: 3, minAmountUsd: 200_000, maxAmountUsd: 1_000_000, buyPrimaryBps: 200, buySecondaryBps: 70, sellSecondaryBps: 70 },
  { id: 4, minAmountUsd: 1_000_000, maxAmountUsd: 5_000_000, buyPrimaryBps: 150, buySecondaryBps: 60, sellSecondaryBps: 60 },
  { id: 5, minAmountUsd: 5_000_000, maxAmountUsd: 20_000_000, buyPrimaryBps: 100, buySecondaryBps: 50, sellSecondaryBps: 50 },
  { id: 6, minAmountUsd: 20_000_000, maxAmountUsd: 50_000_000, buyPrimaryBps: 80, buySecondaryBps: 40, sellSecondaryBps: 40 },
  { id: 7, minAmountUsd: 50_000_000, maxAmountUsd: 100_000_000, buyPrimaryBps: 60, buySecondaryBps: 30, sellSecondaryBps: 30 },
  { id: 8, minAmountUsd: 100_000_000, maxAmountUsd: 999_999_999, buyPrimaryBps: 40, buySecondaryBps: 20, sellSecondaryBps: 20 },
  { id: 9, minAmountUsd: 1_000_000_000, maxAmountUsd: null, buyPrimaryBps: 1, buySecondaryBps: 10, sellSecondaryBps: 10 },
];

export function MockFeesRepo(): FeesRepo {
  return {
    async list() {
      await sleep(jitter());
      return DEFAULT_FEE_TIERS.map((t) => ({ ...t }));
    },
  };
}
