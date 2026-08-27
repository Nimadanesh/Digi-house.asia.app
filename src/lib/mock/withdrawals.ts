// File responsibility: WithdrawalsRepo mock impl — in-memory USDT withdrawal requests
// (PE-02, locked FractionalLuxe model) so Settings can show the request list with statuses
// in demo mode. request() guards against the demo's withdrawable balance (accrued unpaid
// yield, same source as the mock me summary) so the demo behaves like the API's atomic debit.
// The 1% fee is charged at request time; the net is paid in exactly 4 weekly installments.
import type { WithdrawalsRepo } from "@/lib/api/repos";
import type { Withdrawal, WithdrawalInstallment } from "@/types/withdrawal";
import { USER } from "./seed/user";
import { mockLocksState } from "./locks";
import { sleep, jitter } from "./sleep";

const ADDRESS = USER.withdrawalAddress ?? "";

const WITHDRAWAL_FEE_BPS = 100; // 1%
const INSTALLMENT_COUNT = 4;
const INSTALLMENT_DAYS_MS = 7 * 86_400_000;

/** Mirror of the API withdrawal-math: fee = 1% (floor), net = gross − fee, 4 installments summing exactly to net. */
export function planWithdrawal(amountUsd: number): {
  feeUsd: number;
  netUsd: number;
  installments: number[];
} {
  const feeUsd = Math.floor((amountUsd * WITHDRAWAL_FEE_BPS) / 10_000);
  const netUsd = amountUsd - feeUsd;
  const base = Math.floor(netUsd / INSTALLMENT_COUNT);
  const remainder = netUsd - base * INSTALLMENT_COUNT;
  const installments = Array.from(
    { length: INSTALLMENT_COUNT },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
  return { feeUsd, netUsd, installments };
}

function installmentsFor(
  amountUsd: number,
  createdAt: string,
  paidSeq: number,
): WithdrawalInstallment[] {
  const { installments } = planWithdrawal(amountUsd);
  const requestedAt = new Date(createdAt);
  return installments.map((amount, i) => {
    const seq = i + 1;
    const paid = seq <= paidSeq;
    return {
      seq,
      amountUsd: amount,
      status: paid ? "paid" : "pending",
      dueAt: new Date(requestedAt.getTime() + seq * INSTALLMENT_DAYS_MS).toISOString(),
      paidAt: paid ? new Date(requestedAt.getTime() + seq * INSTALLMENT_DAYS_MS).toISOString() : null,
      txHash: paid ? `simulated:installment-${seq}` : null,
    };
  });
}

// Demo state: one fully paid (all 4 installments), one pending review, one rejected.
const state: Withdrawal[] = [
  {
    id: "wd-demo-paid",
    amountUsd: 12_500,
    feeUsd: 125,
    netUsd: 12_375,
    address: ADDRESS,
    status: "paid",
    txHash: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c",
    installments: installmentsFor(12_500, new Date(Date.now() - 30 * 86_400_000).toISOString(), 4),
    createdAt: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: "wd-demo-requested",
    amountUsd: 4_800,
    feeUsd: 48,
    netUsd: 4_752,
    address: ADDRESS,
    status: "requested",
    txHash: null,
    installments: installmentsFor(4_800, new Date(Date.now() - 2 * 86_400_000).toISOString(), 0),
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: "wd-demo-rejected",
    amountUsd: 9_900,
    feeUsd: 99,
    netUsd: 9_801,
    address: ADDRESS,
    status: "rejected",
    txHash: null,
    installments: installmentsFor(9_900, new Date(Date.now() - 14 * 86_400_000).toISOString(), 0),
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
      return state.map((w) => ({ ...w, installments: [...w.installments] }));
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
      const { feeUsd, netUsd } = planWithdrawal(amountUsd);
      const created: Withdrawal = {
        id: `wd-mock-${Date.now()}`,
        amountUsd,
        feeUsd,
        netUsd,
        address: ADDRESS,
        status: "requested",
        txHash: null,
        installments: installmentsFor(amountUsd, now, 0),
        createdAt: now,
        updatedAt: now,
      };
      state.unshift(created);
      return { ...created, installments: [...created.installments] };
    },
  };
}
