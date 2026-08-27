// File responsibility: withdrawal orchestration (PE-02/PE-03, locked FractionalLuxe model).
// requestWithdrawal debits the withdrawable balance atomically at request time (guarded,
// overdraft-safe), charges the 1% fee, and records the request + 4 weekly installments
// (net = gross − fee; installments sum exactly to the net). Admin transitions: approve
// (pure store move), reject (refunds the debit exactly once), pay (marks ONE installment
// paid with the fulfillment tx hash; the withdrawal is fully paid only when all 4
// installments are paid, which flips the ledger row to success).
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import {
  InsufficientBalanceError,
  type BalanceStore,
} from "../money/balance-store.js";
import type {
  WithdrawalInstallmentRecord,
  WithdrawalInstallmentStore,
} from "./installment-store.js";
import {
  installmentDueAt,
  planWithdrawal,
} from "./withdrawal-math.js";
import type { WithdrawalRecord, WithdrawalStore } from "./withdrawal-store.js";

/** Deps shared by the admin transitions (no user store needed). */
export type WithdrawalCoreDeps = {
  balances: BalanceStore;
  transactions: TxStore;
  withdrawals: WithdrawalStore;
  installments: WithdrawalInstallmentStore;
};

/** Deps for the user-facing request (needs the user's saved address). */
export type WithdrawalServiceDeps = WithdrawalCoreDeps & { users: UserStore };

export type RequestWithdrawalResult =
  | {
      ok: true;
      withdrawal: WithdrawalRecord;
      installments: WithdrawalInstallmentRecord[];
      /** 1% fee, integer cents. */
      feeUsd: number;
      /** gross − fee, integer cents. */
      netUsd: number;
      txId: string;
    }
  | {
      ok: false;
      code: "user_not_found" | "no_withdrawal_address" | "insufficient_balance";
    };

export type PayInstallmentResult =
  | { ok: true; withdrawal: WithdrawalRecord; installment: WithdrawalInstallmentRecord }
  | {
      ok: false;
      code: "withdrawal_not_found" | "installment_not_found" | "already_paid" | "terminal";
    };

/**
 * POST /v1/withdrawals — request a payout from the withdrawable balance.
 * Atomic debit of the GROSS amount at request; the 1% fee is FractionalLuxe revenue;
 * the net is paid in exactly 4 weekly installments.
 */
export async function requestWithdrawal(
  deps: WithdrawalServiceDeps,
  input: { userId: string; amountUsd: number },
): Promise<RequestWithdrawalResult> {
  const user = await deps.users.findById(input.userId);
  if (!user) return { ok: false, code: "user_not_found" };
  if (!user.withdrawalAddress) {
    return { ok: false, code: "no_withdrawal_address" };
  }

  try {
    await deps.balances.adjust(input.userId, {
      withdrawableDelta: -input.amountUsd,
    });
  } catch (e) {
    if (e instanceof InsufficientBalanceError) {
      return { ok: false, code: "insufficient_balance" };
    }
    throw e;
  }

  const now = new Date();
  const { feeUsd, netUsd, installments } = planWithdrawal(input.amountUsd);
  const id = `wd_${crypto.randomUUID()}`;
  const txId = `tx_${id}`;
  await deps.transactions.insert({
    id: txId,
    userId: input.userId,
    kind: "withdraw",
    // Gross amount — the 1% fee is recorded separately (FractionalLuxe revenue).
    amountUsd: input.amountUsd,
    feeUsd,
    currency: "USDT",
    status: "pending",
  });
  const withdrawal = await deps.withdrawals.insert({
    id,
    userId: input.userId,
    amountUsd: input.amountUsd,
    feeUsd,
    address: user.withdrawalAddress,
    status: "requested",
    transactionId: txId,
  });
  const rows = installments.map((amountUsd, i) => ({
    id: `wi_${id}_${i + 1}`,
    withdrawalId: id,
    seq: i + 1,
    amountUsd,
    dueAt: installmentDueAt(now, i + 1),
  }));
  const created = await deps.installments.insertMany(rows);
  return { ok: true, withdrawal, installments: created, feeUsd, netUsd, txId };
}

/**
 * Mark one installment (by seq) paid with the admin fulfillment tx hash. Guarded:
 * pending|due → paid once; a withdrawal that is rejected/paid can never be touched.
 * When the last installment is paid the withdrawal flips to `paid` and its pending
 * ledger row moves to success (double-payment protection at every layer).
 */
export async function payInstallment(
  deps: WithdrawalCoreDeps,
  input: { withdrawalId: string; seq: number; txHash: string },
): Promise<PayInstallmentResult> {
  const w = await deps.withdrawals.get(input.withdrawalId);
  if (!w) return { ok: false, code: "withdrawal_not_found" };
  if (w.status === "rejected" || w.status === "paid") {
    return { ok: false, code: "terminal" };
  }
  const all = await deps.installments.listByWithdrawal(input.withdrawalId);
  const target = all.find((i) => i.seq === input.seq);
  if (!target) return { ok: false, code: "installment_not_found" };
  if (target.status === "paid") return { ok: false, code: "already_paid" };

  const paid = await deps.installments.markInstallmentPaid(target.id, input.txHash);
  if (!paid) return { ok: false, code: "already_paid" };

  // All 4 paid → withdrawal paid + ledger success (guarded, idempotent).
  const remaining = all.some((i) => i.id !== paid.id && i.status !== "paid");
  let withdrawal = w;
  if (!remaining) {
    const terminal = await deps.withdrawals.markPaid(input.withdrawalId, input.txHash);
    if (terminal) {
      withdrawal = terminal;
      if (w.transactionId) {
        await deps.transactions.updateStatus(
          w.transactionId,
          "success",
          null,
          input.txHash,
        );
      }
    }
  }
  return { ok: true, withdrawal, installment: paid };
}

/**
 * Mark the NEXT unpaid installment (pending|due, in seq order) paid — the default
 * fulfillment path for the withdrawal-level admin endpoint.
 */
export async function payNextInstallment(
  deps: WithdrawalCoreDeps,
  input: { withdrawalId: string; txHash: string },
): Promise<PayInstallmentResult> {
  const w = await deps.withdrawals.get(input.withdrawalId);
  if (!w) return { ok: false, code: "withdrawal_not_found" };
  if (w.status === "rejected" || w.status === "paid") {
    return { ok: false, code: "terminal" };
  }
  const all = await deps.installments.listByWithdrawal(input.withdrawalId);
  const next = all.find((i) => i.status !== "paid");
  if (!next) return { ok: false, code: "already_paid" };
  return payInstallment(deps, {
    withdrawalId: input.withdrawalId,
    seq: next.seq,
    txHash: input.txHash,
  });
}

/**
 * Admin reject (PE-03) — refunds the withdrawable debit exactly once. The guarded
 * markRejected is the atomic claim: only the transition winner refunds, so concurrent
 * rejects (or a reject racing a mark-paid) can never double-credit. Terminal records
 * (rejected/paid) are returned unchanged. Installments stay behind the rejected parent
 * and are never payable (markInstallmentPaid requires a non-terminal parent).
 */
export async function rejectWithdrawal(
  deps: WithdrawalCoreDeps,
  input: { withdrawalId: string },
): Promise<WithdrawalRecord | null> {
  const w = await deps.withdrawals.get(input.withdrawalId);
  if (!w) return null;
  if (w.status === "rejected" || w.status === "paid") return w;

  const rejected = await deps.withdrawals.markRejected(input.withdrawalId);
  if (!rejected) {
    // Lost the race to another transition — no refund; return the current state.
    return deps.withdrawals.get(input.withdrawalId);
  }
  await deps.balances.adjust(w.userId, { withdrawableDelta: w.amountUsd });
  if (w.transactionId) {
    await deps.transactions.updateStatus(w.transactionId, "failed", "rejected");
  }
  return rejected;
}

/** Admin approve (PE-03) — requested → approved (pure guarded store move). */
export async function approveWithdrawal(
  deps: WithdrawalCoreDeps,
  input: { withdrawalId: string },
): Promise<WithdrawalRecord | null> {
  return deps.withdrawals.markApproved(input.withdrawalId);
}
