// File responsibility: the yield engine (PRODUCT-PLAN §0.4 / Phase B).
// tickYieldAccrual writes one idempotent daily row per lock; tickYieldPayouts settles
// due installments (weekly/monthly cycles + the final payout at unlock request) by
// crediting the withdrawable balance through the overdraft-safe BalanceStore;
// matureDueLocks frees shares 2–3 days after an unlock request.
import type { Logger } from "../logger.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { TxStore } from "../buys/tx-store.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import {
  addDaysToDay,
  dailyAccrualAtDayIndex,
  dayDiff,
  payoutIntervalDays,
  utcDay,
} from "./yield-math.js";
import type { ShareLockRecord, ShareLockStore } from "./lock-store.js";
import type { YieldStore } from "./yield-store.js";

export type YieldNotify = {
  botToken: string;
  getPropertyTitle: (propertyId: string) => Promise<string>;
};

export type YieldEngineDeps = {
  locks: ShareLockStore;
  yields: YieldStore;
  balances: BalanceStore;
  transactions: TxStore;
  log?: Logger;
  /** Optional audit trail for lock maturation (PF-03). */
  audit?: AuditStore | null;
  /** Optional Telegram notify (fail-open). */
  notify?: YieldNotify | null;
};

/** UTC day up to which a lock accrues: unlock request day is inclusive. */
export function accrualCutoffDay(lock: ShareLockRecord, now: Date): string {
  const cutoff =
    lock.unlockRequestedAt && lock.unlockRequestedAt < now
      ? lock.unlockRequestedAt
      : now;
  return utcDay(cutoff);
}

/** Write missing daily accrual rows for one lock (idempotent per lock+day). */
export async function accrueLock(
  deps: YieldEngineDeps,
  lock: ShareLockRecord,
  now: Date,
): Promise<number> {
  const lastDay = await deps.yields.maxAccrualDay(lock.id);
  const startDay = lastDay
    ? addDaysToDay(lastDay, 1)
    : utcDay(lock.lockedAt);
  const endDay = accrualCutoffDay(lock, now);
  const days = dayDiff(startDay, endDay);
  if (days < 0) return 0;

  const lockDay = utcDay(lock.lockedAt);
  const rows = [];
  for (let i = 0; i <= days; i++) {
    const day = addDaysToDay(startDay, i);
    const dayIndex = dayDiff(lockDay, day);
    const amount = dailyAccrualAtDayIndex(
      lock.principalUsd,
      lock.monthlyRate,
      lock.payoutPeriod,
      dayIndex,
    );
    if (amount <= 0) continue;
    rows.push({
      id: `acc_${lock.id}_${day}`,
      lockId: lock.id,
      userId: lock.userId,
      propertyId: lock.propertyId,
      day,
      amountUsd: amount,
      monthlyRate: lock.monthlyRate,
    });
  }
  return deps.yields.insertAccruals(rows);
}

/** Accrue every non-terminal lock. Returns total rows written (for logging). */
export async function tickYieldAccrual(
  deps: YieldEngineDeps,
  now: Date = new Date(),
  userId?: string,
): Promise<{ locks: number; rowsInserted: number }> {
  const active = await deps.locks.listActive(userId);
  let rowsInserted = 0;
  for (const lock of active) {
    try {
      rowsInserted += await accrueLock(deps, lock, now);
    } catch (err) {
      deps.log?.warn({ lockId: lock.id, err }, "yield.accrue.lock_failed");
    }
  }
  return { locks: active.length, rowsInserted };
}

async function notifyPayment(
  deps: YieldEngineDeps,
  lock: ShareLockRecord,
  amountUsd: number,
  periodEnd: string,
  kind: "scheduled" | "final",
): Promise<void> {
  if (!deps.notify) return;
  try {
    const title = await deps.notify
      .getPropertyTitle(lock.propertyId)
      .catch(() => lock.propertyId);
    const text =
      `💸 Yield paid: $${(amountUsd / 100).toFixed(2)} (${lock.payoutPeriod})\n` +
      `🏠 ${title}\n` +
      `📅 through ${periodEnd}${kind === "final" ? " — final payout, lock closed" : ""}\n` +
      `Credited to your withdrawable balance.`;
    const r = await sendTelegramMessage({
      botToken: deps.notify.botToken,
      chatId: lock.userId,
      text,
    });
    if (!r.ok) deps.log?.warn({ chatId: lock.userId }, "yield.notify.failed");
  } catch (err) {
    deps.log?.warn({ err }, "yield.notify.error");
  }
}

export type PayoutTickResult = {
  lockId: string;
  amountUsd: number;
  kind: "scheduled" | "final";
  paymentId: string;
};

/**
 * Settle due payouts: scheduled cycles when next_payout_at has passed, plus the
 * final payout immediately for unlock_requested locks. Payment insert is the
 * idempotency claim — a repeated tick never double-credits.
 */
export async function tickYieldPayouts(
  deps: YieldEngineDeps,
  now: Date = new Date(),
  userId?: string,
): Promise<PayoutTickResult[]> {
  const due = await deps.locks.listDueForPayout(now, userId);
  const settled: PayoutTickResult[] = [];

  for (const lock of due) {
    try {
      // Scheduled cycles pay only through the period end (the day before the due
      // date); final payouts pay through the unlock-request cutoff day inclusive.
      const isFinal = lock.status === "unlock_requested";
      const endDay = isFinal
        ? accrualCutoffDay(lock, now)
        : addDaysToDay(utcDay(lock.nextPayoutAt), -1);
      // Bring accruals up to the payable window before summing.
      const accrueThrough = isFinal
        ? now
        : new Date(`${endDay}T23:59:59.999Z`);
      if (accrueThrough.getTime() <= now.getTime()) {
        await accrueLock(deps, lock, accrueThrough);
      }
      const unpaid = await deps.yields.sumAccruedRange(
        lock.id,
        lock.paidThroughDay,
        endDay,
      );
      if (unpaid > 0) {
        const startDay = lock.paidThroughDay
          ? addDaysToDay(lock.paidThroughDay, 1)
          : utcDay(lock.lockedAt);
        const kind = isFinal ? "final" : "scheduled";
        const paymentId = `ypt_${lock.id}_${startDay}_${endDay}`;
        const payment = await deps.yields.insertPayment({
          id: paymentId,
          lockId: lock.id,
          userId: lock.userId,
          propertyId: lock.propertyId,
          periodStart: startDay,
          periodEnd: endDay,
          amountUsd: unpaid,
          kind,
        });
        if (payment) {
          await deps.balances.adjust(lock.userId, { withdrawableDelta: unpaid });
          await deps.transactions.insert({
            id: `tx_${payment.id}`,
            userId: lock.userId,
            kind: lock.payoutPeriod === "weekly" ? "yield_weekly" : "yield_monthly",
            propertyId: lock.propertyId,
            shares: null,
            amountUsd: unpaid,
            currency: "USDT",
            status: "success",
          });
          settled.push({ lockId: lock.id, amountUsd: unpaid, kind, paymentId });
          deps.log?.info(
            { lockId: lock.id, amountUsd: unpaid, kind },
            "yield.payout.settled",
          );
          await notifyPayment(deps, lock, unpaid, endDay, kind);
        }
      }
      // Advance the cursor even on zero accrual so the due window slides forward.
      const interval = payoutIntervalDays(lock.payoutPeriod);
      await deps.locks.updatePayoutCursor(lock.id, {
        paidThroughDay: endDay,
        nextPayoutAt: new Date(now.getTime() + interval * 86_400_000),
      });
    } catch (err) {
      deps.log?.warn({ lockId: lock.id, err }, "yield.payout.lock_failed");
    }
  }
  return settled;
}

/** Mature unlock_requested locks past the 2–3 day window; shares become sellable. */
export async function matureDueLocks(
  deps: YieldEngineDeps,
  maturationMs: number,
  now: Date = new Date(),
): Promise<string[]> {
  const due = await deps.locks.listDueForMaturation(now, maturationMs);
  const matured: string[] = [];
  for (const lock of due) {
    const row = await deps.locks.markMatured(lock.id, now);
    if (row) {
      matured.push(lock.id);
      deps.log?.info({ lockId: lock.id }, "yield.lock.matured");
      if (deps.audit) {
        await writeAuditEvent(deps.audit, {
          action: "lock.mature",
          actorType: "system",
          actorLabel: "yieldEngine",
          resourceType: "share_lock",
          resourceId: lock.id,
          summary: `Lock matured — ${lock.shares} shares of ${lock.propertyId} are now sellable`,
          payload: {
            lockId: lock.id,
            propertyId: lock.propertyId,
            userId: lock.userId,
            shares: lock.shares,
          },
          requestId: null,
        });
      }
      if (deps.notify) {
        try {
          const title = await deps.notify
            .getPropertyTitle(lock.propertyId)
            .catch(() => lock.propertyId);
          await sendTelegramMessage({
            botToken: deps.notify.botToken,
            chatId: lock.userId,
            text:
              `🔓 Shares unlocked\n` +
              `🏠 ${title}\n` +
              `${lock.shares} shares are now free — you can sell them on the market.`,
          });
        } catch (err) {
          deps.log?.warn({ err }, "yield.notify.matured_error");
        }
      }
    }
  }
  return matured;
}

/** Full engine tick: mature → accrue → pay. Used by the worker queue. */
export async function tickYieldEngine(
  deps: YieldEngineDeps,
  maturationMs: number,
  now: Date = new Date(),
): Promise<{
  matured: string[];
  accrual: { locks: number; rowsInserted: number };
  payouts: PayoutTickResult[];
}> {
  const matured = await matureDueLocks(deps, maturationMs, now);
  const accrual = await tickYieldAccrual(deps, now);
  const payouts = await tickYieldPayouts(deps, now);
  return { matured, accrual, payouts };
}
