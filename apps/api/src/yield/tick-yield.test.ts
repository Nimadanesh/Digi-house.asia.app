import { describe, expect, it } from "vitest";
import { createMemoryShareLockStore } from "./lock-store.js";
import { createMemoryYieldStore } from "./yield-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore, type TxStore } from "../buys/tx-store.js";
import type { TransactionRecord } from "../buys/tx-store.js";
import {
  accrueLock,
  matureDueLocks,
  tickYieldEngine,
  tickYieldPayouts,
  type YieldEngineDeps,
} from "./tick-yield.js";

const DAY = 86_400_000;
const MATURATION = 3 * DAY;

function makeDeps() {
  const locks = createMemoryShareLockStore();
  const yields = createMemoryYieldStore();
  const balances = createMemoryBalanceStore();
  const transactions: TxStore & { _rows: TransactionRecord[] } =
    createMemoryTxStore();
  const deps: YieldEngineDeps = { locks, yields, balances, transactions };
  return { deps, locks, yields, balances, transactions };
}

/** $1,000 @ 6% monthly — daily accrual $2.00, monthly installment $60. */
async function seedLock(deps: YieldEngineDeps, opts?: { period?: "monthly" | "weekly" }) {
  const period = opts?.period ?? "monthly";
  const interval = period === "monthly" ? 30 * DAY : 7 * DAY;
  return deps.locks.create({
    id: "lock-1",
    userId: "user-a",
    propertyId: "prop-1",
    shares: 10,
    principalUsd: 100_000,
    payoutPeriod: period,
    monthlyRate: 6,
    nextPayoutAt: new Date(Date.now() + interval),
  });
}

describe("accrueLock", () => {
  it("writes one row per day from the lock day (inclusive)", async () => {
    const { deps, yields } = makeDeps();
    const lock = await seedLock(deps);
    const now = new Date(lock.lockedAt.getTime() + 2 * DAY);
    const inserted = await accrueLock(deps, lock, now);
    expect(inserted).toBe(3); // day 0, 1, 2
    expect(yields._accruals.map((a) => a.amountUsd)).toEqual([200, 200, 200]);
  });

  it("is idempotent — a second run inserts nothing", async () => {
    const { deps } = makeDeps();
    const lock = await seedLock(deps);
    const now = new Date(lock.lockedAt.getTime() + DAY);
    await accrueLock(deps, lock, now);
    expect(await accrueLock(deps, lock, now)).toBe(0);
  });

  it("stops at the unlock-request cutoff day (inclusive)", async () => {
    const { deps, yields } = makeDeps();
    const lock = await seedLock(deps);
    const requestedAt = new Date(lock.lockedAt.getTime() + DAY);
    await deps.locks.markUnlockRequested(lock.id, requestedAt);
    const now = new Date(lock.lockedAt.getTime() + 10 * DAY);
    await accrueLock(deps, { ...lock, unlockRequestedAt: requestedAt }, now);
    const days = (await deps.yields.maxAccrualDay(lock.id))!;
    // requested on day 1 → last accrual day = day 1
    expect(days).toBe(requestedAt.toISOString().slice(0, 10));
    expect(yields._accruals).toHaveLength(2);
  });
});

describe("tickYieldPayouts", () => {
  it("pays a scheduled cycle when due and credits withdrawable + ledger", async () => {
    const { deps, balances, transactions } = makeDeps();
    const lock = await seedLock(deps, { period: "weekly" });
    // weekly lock: $12.50/week → 7 days accrued = $12.50
    const now = new Date(lock.lockedAt.getTime() + 7 * DAY);
    const settled = await tickYieldPayouts(deps, now);
    expect(settled).toHaveLength(1);
    expect(settled[0]).toMatchObject({ lockId: "lock-1", kind: "scheduled" });
    // $1,000 @ 5% weekly effective → $50/4 = $12.50
    expect(settled[0]!.amountUsd).toBe(1_250);
    const balance = await balances.get("user-a");
    expect(balance?.withdrawableUsd).toBe(1_250);
    expect(transactions._rows).toHaveLength(1);
    expect(transactions._rows[0]).toMatchObject({
      kind: "yield_weekly",
      amountUsd: 1_250,
      status: "success",
    });
    const updated = await deps.locks.get("lock-1");
    // paid through the period end = day before the due date (not "today")
    const dueDay = lock.nextPayoutAt.toISOString().slice(0, 10);
    expect(updated?.paidThroughDay).toBe(
      new Date(new Date(`${dueDay}T00:00:00Z`).getTime() - DAY)
        .toISOString()
        .slice(0, 10),
    );
  });

  it("is idempotent — a repeated tick never double-credits", async () => {
    const { deps, balances } = makeDeps();
    const lock = await seedLock(deps);
    const now = new Date(lock.lockedAt.getTime() + 30 * DAY);
    await tickYieldPayouts(deps, now);
    await tickYieldPayouts(deps, now);
    const balance = await balances.get("user-a");
    expect(balance?.withdrawableUsd).toBe(6_000); // $60 exactly once
  });

  it("pays the final accrued amount on unlock request (cutoff day inclusive)", async () => {
    const { deps, balances } = makeDeps();
    const lock = await seedLock(deps); // monthly, $2/day
    const requestedAt = new Date(lock.lockedAt.getTime() + 10 * DAY);
    await deps.locks.markUnlockRequested(lock.id, requestedAt);
    const settled = await tickYieldPayouts(deps, requestedAt);
    expect(settled[0]).toMatchObject({ kind: "final" });
    expect(settled[0]!.amountUsd).toBe(2_200); // 11 days × $2
    expect((await balances.get("user-a"))?.withdrawableUsd).toBe(2_200);
  });

  it("skips payout when nothing accrued", async () => {
    const { deps, balances } = makeDeps();
    const lock = await seedLock(deps);
    const requestedAt = new Date(lock.lockedAt.getTime()); // same instant
    await deps.locks.markUnlockRequested(lock.id, requestedAt);
    const settled = await tickYieldPayouts(deps, requestedAt);
    // same-day request: exactly one accrual day exists ($2)
    expect(settled).toHaveLength(1);
    expect(settled[0]!.amountUsd).toBe(200);
    expect((await balances.get("user-a"))?.withdrawableUsd).toBe(200);
  });
});

describe("matureDueLocks", () => {
  it("frees shares only after the maturation window", async () => {
    const { deps } = makeDeps();
    const lock = await seedLock(deps);
    const requestedAt = new Date();
    await deps.locks.markUnlockRequested(lock.id, requestedAt);

    const tooEarly = new Date(requestedAt.getTime() + MATURATION - 1);
    expect(await matureDueLocks(deps, MATURATION, tooEarly)).toEqual([]);

    const due = new Date(requestedAt.getTime() + MATURATION);
    expect(await matureDueLocks(deps, MATURATION, due)).toEqual(["lock-1"]);
    const row = await deps.locks.get("lock-1");
    expect(row?.status).toBe("matured");
    expect(await matureDueLocks(deps, MATURATION, due)).toEqual([]); // idempotent
  });
});

describe("tickYieldEngine (full cycle)", () => {
  it("buy → lock → accrue → unlock request (yield stops) → mature", async () => {
    const { deps, balances } = makeDeps();
    const lock = await seedLock(deps, { period: "weekly" });

    // 9 days pass; user requests unlock on day 9 → final payout covers
    // day indices 0..9: one full week ($12.50) + 3 extra days (3 × $1.78)
    const requestedAt = new Date(lock.lockedAt.getTime() + 9 * DAY);
    await deps.locks.markUnlockRequested(lock.id, requestedAt);

    const r1 = await tickYieldEngine(deps, MATURATION, requestedAt);
    const paidTotal = r1.payouts.reduce((s, p) => s + p.amountUsd, 0);
    expect(paidTotal).toBe(1_250 + 3 * 178);

    // maturation passes; final tick matures but accrues/pays nothing new
    const after = new Date(requestedAt.getTime() + MATURATION);
    const r2 = await tickYieldEngine(deps, MATURATION, after);
    expect(r2.matured).toEqual(["lock-1"]);
    expect(r2.payouts).toHaveLength(0);

    const balance = await balances.get("user-a");
    expect(balance?.withdrawableUsd).toBe(1_250 + 3 * 178);
    expect((await deps.locks.get("lock-1"))?.status).toBe("matured");
  });
});
