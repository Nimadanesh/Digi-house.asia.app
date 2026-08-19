import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import type { Logger } from "../logger.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import type { BalanceStore } from "../money/balance-store.js";
import { slidingWindowRateLimit } from "../lib/rate-limit.js";
import type { PayoutPeriod } from "../db/schema/share-locks.js";
import type { ShareLockRecord, ShareLockStore } from "../yield/lock-store.js";
import type { YieldStore } from "../yield/yield-store.js";
import {
  accrueLock,
  tickYieldPayouts,
  type YieldEngineDeps,
} from "../yield/tick-yield.js";
import { installmentUsd, payoutIntervalDays } from "../yield/yield-math.js";

export type LockPublic = {
  id: string;
  propertyId: string;
  propertyTitle?: string;
  shares: number;
  principalUsd: number;
  payoutPeriod: PayoutPeriod;
  monthlyRate: number;
  status: ShareLockRecord["status"];
  lockedAt: string;
  unlockRequestedAt: string | null;
  maturedAt: string | null;
  nextPayoutAt: string;
  /** Set while unlock_requested: when shares become sellable. */
  maturesAt: string | null;
  /** Accrued since the last payout (display only, integer cents). */
  accruedUnpaidUsd: number;
  /** One installment at the lock's period (monthly $ / weekly $). */
  installmentUsd: number;
  /** Comparison figures for the monthly ↔ weekly UI toggle. */
  projectedMonthlyUsd: number;
  projectedWeeklyUsd: number;
};

export type LockRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  holdings: HoldingStore;
  properties: PropertyStore;
  locks: ShareLockStore;
  yields: YieldStore;
  balances: BalanceStore;
  transactions: TxStore;
  /** 2–3 day maturation window in ms (default 3 days). */
  unlockMaturationMs: number;
  /** Injected for tests; defaults to a per-user in-memory sliding window (max 10/min). */
  rateLimiter?: MiddlewareHandler;
  log?: Logger;
  audit?: AuditStore | null;
  /** Optional Telegram notify on unlock request (fail-open). */
  notify?: { botToken: string } | null;
};

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

function engineDeps(deps: LockRouteDeps): YieldEngineDeps {
  return {
    locks: deps.locks,
    yields: deps.yields,
    balances: deps.balances,
    transactions: deps.transactions,
    log: deps.log,
    audit: deps.audit ?? null,
  };
}

async function toPublic(
  deps: LockRouteDeps,
  lock: ShareLockRecord,
  opts?: { propertyTitle?: string },
): Promise<LockPublic> {
  const accruedUnpaid = await deps.yields.sumAccruedAfter(
    lock.id,
    lock.paidThroughDay,
  );
  return {
    id: lock.id,
    propertyId: lock.propertyId,
    ...(opts?.propertyTitle != null
      ? { propertyTitle: opts.propertyTitle }
      : {}),
    shares: lock.shares,
    principalUsd: lock.principalUsd,
    payoutPeriod: lock.payoutPeriod,
    monthlyRate: lock.monthlyRate,
    status: lock.status,
    lockedAt: lock.lockedAt.toISOString(),
    unlockRequestedAt: lock.unlockRequestedAt?.toISOString() ?? null,
    maturedAt: lock.maturedAt?.toISOString() ?? null,
    nextPayoutAt: lock.nextPayoutAt.toISOString(),
    maturesAt:
      lock.status === "unlock_requested" && lock.unlockRequestedAt
        ? new Date(
            lock.unlockRequestedAt.getTime() + deps.unlockMaturationMs,
          ).toISOString()
        : null,
    accruedUnpaidUsd: accruedUnpaid,
    installmentUsd: installmentUsd(
      lock.principalUsd,
      lock.monthlyRate,
      lock.payoutPeriod,
    ),
    projectedMonthlyUsd: installmentUsd(lock.principalUsd, lock.monthlyRate, "monthly"),
    projectedWeeklyUsd: installmentUsd(lock.principalUsd, lock.monthlyRate, "weekly"),
  };
}

export function createLockRoutes(deps: LockRouteDeps) {
  const app = new Hono();

  const sessionMw = requireSession({ session: deps.session, users: deps.users });
  const rateLimit =
    deps.rateLimiter ??
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 10,
      key: (c) => c.get("userId"),
    });

  app.get("/v1/locks", sessionMw, async (c) => {
    const userId = c.get("userId");
    const locks = await deps.locks.listByUser(userId);
    const out = [];
    for (const lock of locks) {
      out.push(await toPublic(deps, lock));
    }
    return c.json({ locks: out });
  });

  app.post("/v1/locks", sessionMw, rateLimit, async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const propertyId = typeof b.propertyId === "string" ? b.propertyId.trim() : "";
    const shares = b.shares;
    const payoutPeriod: unknown = b.payoutPeriod;

    if (!propertyId) {
      return c.json(
        { code: "validation_error", message: "propertyId is required" },
        400,
      );
    }
    if (!isPositiveInt(shares)) {
      return c.json(
        { code: "validation_error", message: "shares must be an integer >= 1" },
        400,
      );
    }
    if (payoutPeriod !== "monthly" && payoutPeriod !== "weekly") {
      return c.json(
        {
          code: "validation_error",
          message: "payoutPeriod must be 'monthly' or 'weekly'",
        },
        400,
      );
    }

    const userId = c.get("userId");
    const holding = await deps.holdings.get(userId, propertyId);
    if (!holding || holding.sharesOwned < 1) {
      return c.json(
        { code: "not_found", message: "You do not own shares of this property" },
        404,
      );
    }
    const lockedShares = await deps.locks.sumActiveLockedShares(userId, propertyId);
    const freeShares = holding.sharesOwned - lockedShares;
    if (shares > freeShares) {
      return c.json(
        {
          code: "insufficient_free_shares",
          message: `Only ${freeShares} free share(s) available to lock`,
          freeShares,
        },
        409,
      );
    }

    const listing = await deps.properties.getById(propertyId);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }

    const principalUsd = shares * holding.avgCostUsd;
    if (principalUsd <= 0) {
      return c.json(
        { code: "validation_error", message: "Lock principal must be positive" },
        400,
      );
    }

    const now = new Date();
    const intervalMs = payoutIntervalDays(payoutPeriod) * 86_400_000;
    const lock = await deps.locks.create({
      id: `lock_${crypto.randomUUID()}`,
      userId,
      propertyId,
      shares,
      principalUsd: principalUsd,
      payoutPeriod,
      monthlyRate: listing.monthlyYieldRate,
      nextPayoutAt: new Date(now.getTime() + intervalMs),
      now,
    });

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "lock.create",
        actorType: "user",
        actorUserId: userId,
        resourceType: "share_lock",
        resourceId: lock.id,
        summary: `Locked ${shares} shares of ${propertyId} (${payoutPeriod}) at ${listing.monthlyYieldRate}%/mo`,
        payload: {
          lockId: lock.id,
          propertyId,
          shares,
          principalUsd,
          payoutPeriod,
          monthlyRate: listing.monthlyYieldRate,
        },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }

    return c.json(
      await toPublic(deps, lock, { propertyTitle: listing.title }),
      201,
    );
  });

  app.post("/v1/locks/:id/unlock-request", sessionMw, rateLimit, async (c) => {
    const lockId = c.req.param("id");
    const userId = c.get("userId");

    const existing = await deps.locks.get(lockId);
    if (!existing || existing.userId !== userId) {
      return c.json({ code: "not_found", message: "Lock not found" }, 404);
    }
    if (existing.status !== "locked") {
      return c.json(
        {
          code: "conflict",
          message:
            existing.status === "unlock_requested"
              ? "Unlock already requested"
              : "Lock already matured",
        },
        409,
      );
    }

    const now = new Date();
    const claimed = await deps.locks.markUnlockRequested(lockId, now);
    if (!claimed) {
      return c.json(
        { code: "conflict", message: "Unlock already requested" },
        409,
      );
    }

    // Accrual stops at `now`; settle the accrued-unpaid amount immediately (final).
    await accrueLock(engineDeps(deps), claimed, now);
    const settled = await tickYieldPayouts(engineDeps(deps), now);
    const finalPayment = settled.find((s) => s.lockId === lockId) ?? null;

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "lock.unlock_request",
        actorType: "user",
        actorUserId: userId,
        resourceType: "share_lock",
        resourceId: lockId,
        summary: `Unlock requested for ${claimed.shares} shares of ${claimed.propertyId}; yield stopped`,
        payload: {
          lockId,
          propertyId: claimed.propertyId,
          finalPaymentUsd: finalPayment?.amountUsd ?? 0,
          maturesAt: new Date(now.getTime() + deps.unlockMaturationMs).toISOString(),
        },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }

    if (deps.notify) {
      try {
        await sendTelegramMessage({
          botToken: deps.notify.botToken,
          chatId: userId,
          text:
            `🔒 Unlock requested\n` +
            `Yield stopped accruing. Your shares become sellable on ` +
            `${new Date(now.getTime() + deps.unlockMaturationMs).toISOString().slice(0, 10)}.`,
        });
      } catch {
        // fail-open: notification must never block the unlock
      }
    }

    const fresh = (await deps.locks.get(lockId))!;
    return c.json({
      lock: await toPublic(deps, fresh),
      finalPayment: finalPayment
        ? {
            amountUsd: finalPayment.amountUsd,
            kind: finalPayment.kind,
          }
        : null,
    });
  });

  return app;
}
