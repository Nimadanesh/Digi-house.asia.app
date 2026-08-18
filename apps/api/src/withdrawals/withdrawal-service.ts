// File responsibility: withdrawal orchestration (PE-02/PE-03). requestWithdrawal debits the
// withdrawable balance atomically at request time (guarded, overdraft-safe) and records the
// request + pending ledger row. Admin transitions: approve (pure store move), reject (refunds
// the debit exactly once — guarded so a race can't double-credit), and pay (marks paid + moves
// the ledger row to success with the fulfillment tx hash).
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import {
  InsufficientBalanceError,
  type BalanceStore,
} from "../money/balance-store.js";
import type { WithdrawalRecord, WithdrawalStore } from "./withdrawal-store.js";

/** Deps shared by the admin transitions (no user store needed). */
export type WithdrawalCoreDeps = {
  balances: BalanceStore;
  transactions: TxStore;
  withdrawals: WithdrawalStore;
};

/** Deps for the user-facing request (needs the user's saved address). */
export type WithdrawalServiceDeps = WithdrawalCoreDeps & { users: UserStore };

export type RequestWithdrawalResult =
  | { ok: true; withdrawal: WithdrawalRecord; txId: string }
  | {
      ok: false;
      code: "user_not_found" | "no_withdrawal_address" | "insufficient_balance";
    };

/**
 * POST /v1/withdrawals — request a USDT payout from the withdrawable balance.
 * Requires a saved withdrawal address (PE-01). The debit is atomic; on success a
 * `requested` record + a `pending` ledger row (kind 'withdraw') are written.
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

  const id = `wd_${crypto.randomUUID()}`;
  const txId = `tx_${id}`;
  await deps.transactions.insert({
    id: txId,
    userId: input.userId,
    kind: "withdraw",
    amountUsd: input.amountUsd,
    currency: "USDT",
    status: "pending",
  });
  const withdrawal = await deps.withdrawals.insert({
    id,
    userId: input.userId,
    amountUsd: input.amountUsd,
    address: user.withdrawalAddress,
    status: "requested",
    transactionId: txId,
  });
  return { ok: true, withdrawal, txId };
}

/**
 * Admin reject (PE-03) — refunds the withdrawable debit exactly once. The guarded
 * markRejected is the atomic claim: only the transition winner refunds, so concurrent
 * rejects (or a reject racing a mark-paid) can never double-credit. Terminal records
 * (rejected/paid) are returned unchanged.
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

/**
 * Admin mark-paid (PE-03) — approved (or requested) → paid with the fulfillment
 * tx hash, and the ledger row moves to success. Guarded: only the transition winner
 * touches the ledger.
 */
export async function payWithdrawal(
  deps: WithdrawalCoreDeps,
  input: { withdrawalId: string; txHash: string },
): Promise<WithdrawalRecord | null> {
  const w = await deps.withdrawals.get(input.withdrawalId);
  if (!w) return null;
  const paid = await deps.withdrawals.markPaid(input.withdrawalId, input.txHash);
  if (paid && w.transactionId) {
    await deps.transactions.updateStatus(
      w.transactionId,
      "success",
      null,
      input.txHash,
    );
  }
  return paid;
}
