// File responsibility: injection point. Phase 6+ replaces this body with the real TON/backend repos.
import type { Repos } from "./repos";
import {
  MockMarketplaceRepo,
  MockOrderBookRepo,
  MockPortfolioRepo,
  MockEarningsRepo,
  MockTxRepo,
} from "@/lib/mock";

let cached: Repos | null = null;
export function getRepo(): Repos {
  if (cached) return cached;
  cached = {
    marketplace: MockMarketplaceRepo(),
    orderBook: MockOrderBookRepo(),
    portfolio: MockPortfolioRepo(),
    earnings: MockEarningsRepo(),
    tx: MockTxRepo(),
  };
  return cached;
}