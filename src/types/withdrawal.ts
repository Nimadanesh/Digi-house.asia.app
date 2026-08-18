/** USDT payout requests (PE-02). Money: integer cents (minor units). */
export type WithdrawalStatus = "requested" | "approved" | "rejected" | "paid";

export interface Withdrawal {
  id: string;
  amountUsd: number;
  /** Address snapshot at request time. */
  address: string;
  status: WithdrawalStatus;
  txHash: string | null;
  createdAt: string;
  updatedAt: string;
}
