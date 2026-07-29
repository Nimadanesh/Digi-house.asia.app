// File responsibility: user on-chain transactions (>=1 success + >=1 pending + >=1 failed).
import type { Transaction } from "@/types/transaction";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
import { USER } from "./user";

// >=1 success + >=1 pending + >=1 failed.
export const TRANSACTIONS: Transaction[] = [
  {
    id: "tx-bayside-buy-success",
    kind: "buy",
    propertyId: "prop-bayside-marina-penthouse",
    userId: USER.id,
    shares: 60,
    amountUsd: 60 * 25000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-03-05T09:42:00Z",
  },
  {
    id: "tx-alfama-buy-success",
    kind: "buy",
    propertyId: "prop-alfama-terrace-flat",
    userId: USER.id,
    shares: 75,
    amountUsd: 75 * 10000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-04-19T12:10:00Z",
  },
  {
    id: "tx-marina-buy-pending",
    kind: "buy",
    propertyId: "prop-marina-vista-4b",
    userId: USER.id,
    shares: 10,
    amountUsd: 10 * 12500,
    status: "pending",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-22T18:05:00Z",
  },
  {
    id: "tx-tbilisi-buy-failed",
    kind: "buy",
    propertyId: "prop-tbilisi-riverhouse-loft",
    userId: USER.id,
    shares: 4,
    amountUsd: 4 * 8000,
    status: "failed",
    error: "wallet rejected the buy transaction",
    createdAt: "2026-07-15T10:20:00Z",
  },
];