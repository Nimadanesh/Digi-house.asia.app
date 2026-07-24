export type EarningsStatus = "paid" | "pending";

export interface EarningsEntry {
  id: string;
  userId: string;
  propertyId: string;
  weekOf: string;              // ISO Monday
  amountUsd: number;           // minor units paid this week
  tonAmount: number;           // nanoTON
  shareRatio: number;          // 0..1
  status: EarningsStatus;
  txHash?: string;             // "simulated:<uuid>" in MVP
}

export interface EarningsSummary {
  allTimeUsd: number;
  thisWeekProjectedUsd: number;
  projectedNextWeekUsd: number;
  entries: EarningsEntry[];
}

export interface RentalDistribution {
  id: string;
  propertyId: string;
  weekOf: string;
  rentPoolUsd: number;
  rentPoolNanoTon: number;
  payoutDay: string;
  status: "scheduled" | "distributing" | "completed";
  totalShares: number;
  createdAt: string;
}