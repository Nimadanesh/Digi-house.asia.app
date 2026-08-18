// File responsibility: aggregate seed barrel (compose per-entity generators into a frozen Seed).
import type { Listing } from "@/types/property";
import type { Order, OrderBookState } from "@/types/order";
import type { Holding, PortfolioSummary } from "@/types/position";
import type { EarningsEntry, EarningsSummary, RentalDistribution } from "@/types/earnings";
import type { Transaction } from "@/types/transaction";
import type { UserProfile } from "@/types/user";
import { PROPERTIES } from "./properties";
import { USER } from "./user";
import { HOLDINGS } from "./holdings";
import { EARNINGS_ENTRIES } from "./earnings";
import { DISTRIBUTIONS } from "./distributions";
import { ORDER_BOOKS, OPEN_ORDERS } from "./orderbooks";
import { TRANSACTIONS } from "./transactions";

export interface Seed {
  user: UserProfile;
  properties: Listing[];
  holdings: Holding[];
  earnings: EarningsEntry[];
  distributions: RentalDistribution[];
  openOrders: Order[];
  orderBooks: OrderBookState[];
  transactions: Transaction[];
}

export const seed: Seed = Object.freeze({
  user: USER,
  properties: PROPERTIES,
  holdings: HOLDINGS,
  earnings: EARNINGS_ENTRIES,
  distributions: DISTRIBUTIONS,
  openOrders: OPEN_ORDERS,
  orderBooks: ORDER_BOOKS,
  transactions: TRANSACTIONS,
});

export const seedPortfolioSummary = (): PortfolioSummary => {
  const totalInvestedUsd = HOLDINGS.reduce((s, h) => s + h.sharesOwned * h.avgCostUsd, 0);
  const totalValueUsd = HOLDINGS.reduce((s, h) => s + h.currentValueUsd, 0);
  const totalEarningsUsd = EARNINGS_ENTRIES.filter((e) => e.status === "paid").reduce(
    (s, e) => s + e.amountUsd,
    0,
  );
  const weeklyProjectedUsd = EARNINGS_ENTRIES.filter((e) => e.status === "pending").reduce(
    (s, e) => s + e.amountUsd,
    0,
  );
  return {
    totalValueUsd,
    totalInvestedUsd,
    totalEarningsUsd,
    weeklyProjectedUsd,
    // Simulated day change for Home badge (demo — not live market data).
    dayChangeRatio: totalInvestedUsd > 0
      ? Math.max(-0.05, Math.min(0.08, (totalValueUsd - totalInvestedUsd) / totalInvestedUsd * 0.15))
      : 0,
    holdings: [...HOLDINGS],
    openOrders: [...OPEN_ORDERS],
  };
};

export const seedEarningsSummary = (): EarningsSummary => {
  const paid = EARNINGS_ENTRIES.filter((e) => e.status === "paid");
  const pending = EARNINGS_ENTRIES.filter((e) => e.status === "pending");
  const allTimeUsd = paid.reduce((s, e) => s + e.amountUsd, 0);
  const thisWeekProjectedUsd = pending.reduce((s, e) => s + e.amountUsd, 0);
  return {
    allTimeUsd,
    thisWeekProjectedUsd,
    projectedNextWeekUsd: thisWeekProjectedUsd,
    entries: [...EARNINGS_ENTRIES].sort((a, b) => b.weekOf.localeCompare(a.weekOf)),
  };
};