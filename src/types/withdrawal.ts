/** USDT payout requests (PE-02, FractionalLuxe locked model). Money: integer cents (minor units). */
export type WithdrawalStatus = "requested" | "approved" | "rejected" | "paid";

/** One of the 4 weekly installments the net amount is paid in. */
export type WithdrawalInstallmentStatus = "pending" | "due" | "paid";

export interface WithdrawalInstallment {
  seq: number;
  amountUsd: number;
  status: WithdrawalInstallmentStatus;
  dueAt: string;
  paidAt: string | null;
  txHash: string | null;
}

export interface Withdrawal {
  id: string;
  /** Gross amount debited at request time, integer cents. */
  amountUsd: number;
  /** 1% withdrawal fee (FractionalLuxe revenue), integer cents. */
  feeUsd: number;
  /** gross − fee, integer cents. */
  netUsd: number;
  /** Address snapshot at request time. */
  address: string;
  status: WithdrawalStatus;
  txHash: string | null;
  /** The net is paid in exactly 4 weekly installments; Σ = netUsd. */
  installments: WithdrawalInstallment[];
  createdAt: string;
  updatedAt: string;
}
