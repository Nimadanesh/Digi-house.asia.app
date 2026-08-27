// File responsibility: pure math for the locked FractionalLuxe withdrawal model.
// Withdrawal on request → 1% fee charged at request time; the net (gross − fee) is
// paid in exactly 4 weekly installments. Installments always sum exactly to the net
// (remainder spread one cent at a time onto the earliest installments — dust policy).
// This is NOT platform transaction commission (see fees/) and NOT yield.
import {
  WITHDRAWAL_FEE_BPS,
  WITHDRAWAL_INSTALLMENT_COUNT,
  WITHDRAWAL_INSTALLMENT_DAYS,
} from "./withdrawal-constants.js";

export type WithdrawalPlan = {
  /** 1% of the gross, integer cents, floor-rounded. */
  feeUsd: number;
  /** gross − fee, integer cents. */
  netUsd: number;
  /** Exactly 4 installment amounts, integer cents; Σ = netUsd exactly. */
  installments: number[];
};

export function planWithdrawal(amountUsd: number): WithdrawalPlan {
  const feeUsd = Math.floor((amountUsd * WITHDRAWAL_FEE_BPS) / 10_000);
  const netUsd = amountUsd - feeUsd;
  const base = Math.floor(netUsd / WITHDRAWAL_INSTALLMENT_COUNT);
  const remainder = netUsd - base * WITHDRAWAL_INSTALLMENT_COUNT;
  const installments = Array.from(
    { length: WITHDRAWAL_INSTALLMENT_COUNT },
    (_, i) => base + (i < remainder ? 1 : 0),
  );
  return { feeUsd, netUsd, installments };
}

/** Due date of installment `seq` (1-based) counting from the request time. */
export function installmentDueAt(requestedAt: Date, seq: number): Date {
  return new Date(
    requestedAt.getTime() + seq * WITHDRAWAL_INSTALLMENT_DAYS * 86_400_000,
  );
}
