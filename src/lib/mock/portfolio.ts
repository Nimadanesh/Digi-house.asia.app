// File responsibility: PortfolioRepo mock impl.
import type { PortfolioRepo } from "@/lib/api/repos";
import type { PortfolioSummary } from "@/types/position";
import { seedPortfolioSummary } from "./seed";
import { sleep, jitter } from "./sleep";

export function MockPortfolioRepo(): PortfolioRepo {
  return {
    async summary(): Promise<PortfolioSummary> {
      await sleep(jitter());
      return seedPortfolioSummary();
    },
  };
}