// File responsibility: WithdrawalsRepo mock impl — in-memory USDT withdrawal requests
// (PE-02) so Settings can show the request list with statuses in demo mode. request()
// guards against the demo's withdrawable balance (accrued unpaid yield, same source as
// the mock me summary) so the demo behaves like the API's atomic debit.
import type { WithdrawalsRepo } from "@/lib/api/repos";
import type { Withdrawal } from "@/types/withdrawal";
import { USER } from "./seed/user";
import { mockLocksState } from "./locks";
import { sleep, jitter } from "./sleep";

const ADDRESS = USER.withdrawalAddress ?? "";

// Demo state: one paid (with tx hash), one pending review, one rejected.
const state: Withdrawal[] = [
  {
    id: "wd-demo-paid",
    amountUsd: 12_500,
    address: ADDRESS,
    status: "paid",
    txHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    createdAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  },
  {
    id: "wd-demo-requested",
    amountUsd: 4_800,
    address: ADDRESS,
    status: "requested",
    txHash: null,
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: "wd-demo-rejected",
    amountUsd: 9_900,
    address: ADDRESS,
    status: "rejected",
    txHash: null,
    createdAt: new Date(Date.now() - 14 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 13 * 86_400_000).toISOString(),
  },
];

/** Demo withdrawable balance = accrued unpaid yield (same math as MockMeRepo.summary). */
function mockWithdrawableUsd(): number {
  return mockLocksState()
    .filter((s) => s.lock.status !== "matured")
    .reduce((sum, s) => sum + s.lock.accruedUnpaidUsd, 0);
}

export function MockWithdrawalsRepo(): WithdrawalsRepo {
  return {
    async list() {
      await sleep(jitter());
      return state.map((w) => ({ ...w }));
    },

    async request(input) {
      await sleep(jitter());
      const amountUsd = input.amountUsd;
      if (!Number.isInteger(amountUsd) || amountUsd < 1) {
        throw new Error("amountUsd must be an integer >= 1 (cents)");
      }
      const withdrawable = mockWithdrawableUsd();
      if (amountUsd > withdrawable) {
        throw new Error("Withdrawable balance is too low for this amount");
      }
      const now = new Date().toISOString();
      const created: Withdrawal = {
        id: `wd-mock-${Date.now()}`,
        amountUsd,
        address: ADDRESS,
        status: "requested",
        txHash: null,
        createdAt: now,
        updatedAt: now,
      };
      state.unshift(created);
      return { ...created };
    },
  };
}
