// File responsibility: MeRepo mock impl — derives the Home summary from mock
// holdings + the mock locks state so the demo matches the product shape.
import type { MeRepo } from "@/lib/api/repos";
import { HOLDINGS } from "./seed/holdings";
import { installmentUsd } from "@/lib/yield-math";
import { sleep, jitter } from "./sleep";
import { mockLocksState } from "./locks";

export function MockMeRepo(): MeRepo {
  return {
    async summary() {
      await sleep(jitter());
      const owned = HOLDINGS.reduce((s, h) => s + h.sharesOwned, 0);
      const active = mockLocksState().filter(
        (s) => s.lock.status !== "matured",
      );
      const locked = active.reduce((s, x) => s + x.lock.shares, 0);
      const monthly = active.reduce(
        (s, x) =>
          s + installmentUsd(x.lock.principalUsd, x.lock.monthlyRate, "monthly"),
        0,
      );
      const weekly = active.reduce(
        (s, x) =>
          s + installmentUsd(x.lock.principalUsd, x.lock.monthlyRate, "weekly"),
        0,
      );
      const unpaid = active.reduce((s, x) => s + x.lock.accruedUnpaidUsd, 0);
      return {
        balances: { investingUsd: 125_000, withdrawableUsd: unpaid },
        shares: { locked, free: Math.max(0, owned - locked) },
        yield: {
          thisMonthAccruedUsd: unpaid * 2,
          accruedUnpaidUsd: unpaid,
          projectedMonthlyUsd: monthly,
          projectedWeeklyUsd: weekly,
        },
      };
    },
  };
}
