/** Share locks + yield (PRODUCT-PLAN §0.4). Money: integer cents (minor units). */

export type PayoutPeriod = "monthly" | "weekly";
export type LockStatus = "locked" | "unlock_requested" | "matured";

export interface ShareLock {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  shares: number;
  principalUsd: number;
  payoutPeriod: PayoutPeriod;
  /** Percent with two decimals, e.g. 6.25. */
  monthlyRate: number;
  status: LockStatus;
  lockedAt: string;
  unlockRequestedAt: string | null;
  maturedAt: string | null;
  nextPayoutAt: string;
  /** While unlock_requested: when shares become sellable. */
  maturesAt: string | null;
  /** Accrued since the last payout (display only). */
  accruedUnpaidUsd: number;
  /** One installment at the lock's period. */
  installmentUsd: number;
  /** Comparison figures for the monthly ↔ weekly toggle. */
  projectedMonthlyUsd: number;
  projectedWeeklyUsd: number;
}

export interface UnlockRequestResult {
  lock: ShareLock;
  finalPayment: { amountUsd: number; kind: "scheduled" | "final" } | null;
}

export interface YieldPayment {
  id: string;
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  amountUsd: number;
  kind: "scheduled" | "final";
  status: "paid" | "pending";
  createdAt: string;
}

/** Additive `yield` block on GET /v1/earnings (v2). */
export interface YieldSummary {
  activeLocks: number;
  lockedShares: number;
  principalUsd: number;
  accruedUnpaidUsd: number;
  projectedInstallmentUsd: number;
  projectedMonthlyUsd: number;
  projectedWeeklyUsd: number;
  payments: YieldPayment[];
}

/** GET /v1/me/summary — Home dashboard in one call. */
export interface MeSummary {
  balances: { investingUsd: number; withdrawableUsd: number };
  shares: { locked: number; free: number };
  yield: {
    thisMonthAccruedUsd: number;
    accruedUnpaidUsd: number;
    projectedMonthlyUsd: number;
    projectedWeeklyUsd: number;
  };
}
