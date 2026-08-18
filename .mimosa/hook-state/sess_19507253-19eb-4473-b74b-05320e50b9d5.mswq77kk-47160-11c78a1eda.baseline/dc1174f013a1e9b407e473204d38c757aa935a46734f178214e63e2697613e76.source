export type TxKind = "buy" | "sell" | "earnings" | "withdraw";
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
}