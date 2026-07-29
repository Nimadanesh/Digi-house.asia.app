// File responsibility: EarningsRepo mock impl + honest tickPayout (synthetic txHash only).
import type { EarningsRepo } from "@/lib/api/repos";
import type { EarningsSummary } from "@/types/earnings";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";

export function MockEarningsRepo(): EarningsRepo {
  let entries = [...seed.earnings];
  return {
    async summary(): Promise<EarningsSummary> {
      await sleep(jitter());
      const paid = entries.filter((e) => e.status === "paid");
      const pendingThisWeek = entries.filter((e) => e.status === "pending");
      return {
        allTimeUsd: paid.reduce((s, e) => s + e.amountUsd, 0),
        thisWeekProjectedUsd: pendingThisWeek.reduce((s, e) => s + e.amountUsd, 0),
        projectedNextWeekUsd: pendingThisWeek.reduce((s, e) => s + e.amountUsd, 0),
        entries: [...entries].sort((a, b) => b.weekOf.localeCompare(a.weekOf)),
      };
    },
    async tickPayout(): Promise<{ distributionId: string; paidEntries: number }> {
      await sleep(jitter());
      let paid = 0;
      entries = entries.map((e) => {
        if (e.status === "pending") {
          paid++;
          return { ...e, status: "paid" as const, txHash: makeSyntheticTxHash() };
        }
        return e;
      });
      return { distributionId: `dist-${Date.now()}`, paidEntries: paid };
    },
  };
}