// File responsibility: LocksRepo mock impl — in-memory locks with live accrual math
// mirroring the API engine, so the demo behaves like the product (§0.4).
import type { LocksRepo } from "@/lib/api/repos";
import type { PayoutPeriod, ShareLock } from "@/types/lock";
import { PROPERTIES } from "./seed/properties";
import { HOLDINGS } from "./seed/holdings";
import { sleep, jitter } from "./sleep";
import { accruedUsd, installmentUsd, payoutIntervalDays } from "@/lib/yield-math";

const DAY = 86_400_000;
const MATURATION = 3 * DAY;

interface LockState {
  lock: ShareLock;
  paidThroughDay: number; // day index already paid out
}

function seedLock(
  id: string,
  propertyId: string,
  shares: number,
  avgCostUsd: number,
  period: PayoutPeriod,
  lockedDaysAgo: number,
  status: ShareLock["status"] = "locked",
): LockState {
  const rate =
    PROPERTIES.find((p) => p.id === propertyId)?.monthlyYieldRate ?? 5.5;
  const principal = shares * avgCostUsd;
  const lockedAt = new Date(Date.now() - lockedDaysAgo * DAY);
  const paidThrough = status === "locked" ? Math.floor(lockedDaysAgo / payoutIntervalDays(period)) * payoutIntervalDays(period) - 1 : lockedDaysAgo;
  const lock: ShareLock = {
    id,
    propertyId,
    propertyTitle: PROPERTIES.find((p) => p.id === propertyId)?.title,
    shares,
    principalUsd: principal,
    payoutPeriod: period,
    monthlyRate: rate,
    status,
    lockedAt: lockedAt.toISOString(),
    unlockRequestedAt: null,
    maturedAt: null,
    nextPayoutAt: new Date(
      lockedAt.getTime() +
        (Math.floor(lockedDaysAgo / payoutIntervalDays(period)) + 1) *
          payoutIntervalDays(period) *
          DAY,
    ).toISOString(),
    maturesAt: null,
    accruedUnpaidUsd: accruedUsd(principal, rate, period, lockedDaysAgo - paidThrough - 1),
    installmentUsd: installmentUsd(principal, rate, period),
    projectedMonthlyUsd: installmentUsd(principal, rate, "monthly"),
    projectedWeeklyUsd: installmentUsd(principal, rate, "weekly"),
  };
  return { lock, paidThroughDay: paidThrough };
}

// Demo state: one accruing weekly lock on Bayside + one matured history row.
const state: LockState[] = [
  seedLock("lock_demo_bayside", "prop-bayside-marina-penthouse", 100, 12000, "weekly", 9),
  seedLock("lock_demo_alfama", "prop-alfama-terrace-flat", 40, 10500, "monthly", 64, "matured"),
];

/** Shared read access for the mock me-summary repo. */
export function mockLocksState(): readonly LockState[] {
  return state;
}

function activeLockedShares(propertyId: string): number {
  return state
    .filter(
      (s) =>
        s.lock.propertyId === propertyId && s.lock.status !== "matured",
    )
    .reduce((sum, s) => sum + s.lock.shares, 0);
}

export function MockLocksRepo(): LocksRepo {
  return {
    async list() {
      await sleep(jitter());
      return { locks: state.map((s) => ({ ...s.lock })) };
    },

    async create(input) {
      await sleep(jitter());
      const holding = HOLDINGS.find((h) => h.propertyId === input.propertyId);
      const property = PROPERTIES.find((p) => p.id === input.propertyId);
      if (!holding || !property) {
        throw new Error("You do not own shares of this property");
      }
      const free =
        holding.sharesOwned - activeLockedShares(input.propertyId);
      if (input.shares > free) {
        throw new Error(`Only ${free} free share(s) available to lock`);
      }
      const created = seedLock(
        `lock_mock_${Date.now()}`,
        input.propertyId,
        input.shares,
        holding.avgCostUsd,
        input.payoutPeriod,
        0,
      );
      created.lock.lockedAt = new Date().toISOString();
      state.push(created);
      return { ...created.lock };
    },

    async requestUnlock(lockId) {
      await sleep(jitter());
      const s = state.find((x) => x.lock.id === lockId);
      if (!s) throw new Error("Lock not found");
      if (s.lock.status !== "locked") throw new Error("Unlock already requested");
      const now = new Date();
      const finalPayment = s.lock.accruedUnpaidUsd;
      s.lock.status = "unlock_requested";
      s.lock.unlockRequestedAt = now.toISOString();
      s.lock.maturesAt = new Date(now.getTime() + MATURATION).toISOString();
      s.lock.accruedUnpaidUsd = 0;
      return {
        lock: { ...s.lock },
        finalPayment: finalPayment > 0 ? { amountUsd: finalPayment, kind: "final" as const } : null,
      };
    },
  };
}
