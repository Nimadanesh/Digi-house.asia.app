export type TxKind =
  | "buy"
  | "sell"
  | "earnings"
  | "withdraw"
  | "instant_sell"
  | "trade_buy"
  | "trade_sell"
  | "yield_monthly"
  | "yield_weekly";
export type TxStatus = "pending" | "success" | "failed";

export interface Transaction {
  id: string;
  kind: TxKind;
  propertyId?: string;
  userId: string;
  shares?: number;
  amountUsd: number;   // minor units
  tonAmount?: number;  // nanoTON
  status: TxStatus;
  txHash?: string;
  error?: string;
  createdAt: string;
  propertyTitle?: string;
  propertyImage?: string;
  /** Platform commission, integer cents (§0.5) — present on instant sells & secondary trades. */
  feeUsd?: number;
}