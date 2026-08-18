import { Hono } from "hono";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { ShareLockStore } from "../yield/lock-store.js";
import type { YieldStore } from "../yield/yield-store.js";
import { installmentUsd, utcDay } from "../yield/yield-math.js";
import { isValidTonAddress } from "../ton/address.js";

export type MeRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  balances: BalanceStore | null;
  holdings: HoldingStore | null;
  locks: ShareLockStore | null;
  yields: YieldStore | null;
};

export type MeSummaryPublic = {
  balances: { investingUsd: number; withdrawableUsd: number };
  shares: { locked: number; free: number };
  yield: {
    /** Accrued from the 1st of the current UTC month (paid + unpaid). */
    thisMonthAccruedUsd: number;
    accruedUnpaidUsd: number;
    projectedMonthlyUsd: number;
    projectedWeeklyUsd: number;
  };
};

/**
 * GET /v1/me/summary — one call for the Home dashboard (PRODUCT-PLAN PB-07):
 * dual wallet balances, locked/free shares, and current yield figures.
 */
export function createMeRoutes(deps: MeRouteDeps) {
  const app = new Hono();

  app.get(
    "/v1/me/summary",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const userId = c.get("userId");
      const now = new Date();
      const monthStart = `${now.toISOString().slice(0, 7)}-01`;

      const balance = (await deps.balances?.get(userId)) ?? {
        investingUsd: 0,
        withdrawableUsd: 0,
      };

      const holdings = (await deps.holdings?.listByUserId(userId)) ?? [];
      const ownedShares = holdings.reduce((s, h) => s + h.sharesOwned, 0);

      const locks = (await deps.locks?.listByUser(userId)) ?? [];
      const active = locks.filter(
        (l) => l.status === "locked" || l.status === "unlock_requested",
      );
      const lockedShares = active.reduce((s, l) => s + l.shares, 0);

      let thisMonthAccruedUsd = 0;
      let accruedUnpaidUsd = 0;
      let projectedMonthlyUsd = 0;
      let projectedWeeklyUsd = 0;
      if (deps.yields) {
        thisMonthAccruedUsd = await deps.yields.sumAccruedBetween(
          userId,
          monthStart,
          utcDay(now),
        );
      }
      for (const lock of active) {
        accruedUnpaidUsd += await deps.yields?.sumAccruedAfter(
          lock.id,
          lock.paidThroughDay,
        ) ?? 0;
        projectedMonthlyUsd += installmentUsd(lock.principalUsd, lock.monthlyRate, "monthly");
        projectedWeeklyUsd += installmentUsd(lock.principalUsd, lock.monthlyRate, "weekly");
      }

      const body: MeSummaryPublic = {
        balances: {
          investingUsd: balance.investingUsd,
          withdrawableUsd: balance.withdrawableUsd,
        },
        shares: {
          locked: lockedShares,
          free: Math.max(0, ownedShares - lockedShares),
        },
        yield: {
          thisMonthAccruedUsd,
          accruedUnpaidUsd,
          projectedMonthlyUsd,
          projectedWeeklyUsd,
        },
      };
      return c.json(body);
    },
  );

  /**
   * POST /v1/me/withdrawal-address — save/change the USDT withdrawal destination
   * (PE-01). Format-validated with @ton/core; any change resets the verified flag.
   */
  app.post(
    "/v1/me/withdrawal-address",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
      }
      const b = (body ?? {}) as Record<string, unknown>;
      const address = typeof b.address === "string" ? b.address.trim() : "";

      if (!address) {
        return c.json(
          { code: "validation_error", message: "address is required" },
          400,
        );
      }
      if (!isValidTonAddress(address)) {
        return c.json(
          { code: "validation_error", message: "invalid TON address" },
          400,
        );
      }

      const userId = c.get("userId");
      const user = await deps.users.updateWithdrawalAddress(userId, address);
      if (!user) {
        return c.json({ code: "not_found", message: "User not found" }, 404);
      }
      return c.json({ user });
    },
  );

  return app;
}
