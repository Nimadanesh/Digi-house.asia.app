import type { Order } from "./order";

export interface Holding {
  propertyId: string;
  sharesOwned: number;
  avgCostUsd: number;             // minor units per share (avg)
  currentValueUsd: number;       // minor units total market value
  pendingWeekEarningsUsd: number; // minor units, next distribution
  shareRatio: number;             // 0..1
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalInvestedUsd: number;
  totalEarningsUsd: number;
  weeklyProjectedUsd: number;
  holdings: Holding[];
  openOrders: Order[];
}