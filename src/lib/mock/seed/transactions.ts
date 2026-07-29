// File responsibility: user on-chain transactions (>=1 success + >=1 pending + >=1 failed).
import type { Transaction } from "@/types/transaction";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
import { USER } from "./user";

export const TRANSACTIONS: Transaction[] = [
  // --- Buys ---
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
  // --- Sell ---
  {
    id: "tx-alfama-sell-success",
    kind: "sell",
    propertyId: "prop-alfama-terrace-flat",
    userId: USER.id,
    shares: -25,
    amountUsd: -25 * 10500,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-06-01T14:30:00Z",
  },
  // --- Earnings ---
  {
    id: "tx-weekly-earnings-jun28",
    kind: "earnings",
    userId: USER.id,
    amountUsd: 4200,
    status: "success",
    txHash: "simulated:dist-jun28",
    createdAt: "2026-06-28T00:00:00Z",
  },
  {
    id: "tx-weekly-earnings-jul05",
    kind: "earnings",
    userId: USER.id,
    amountUsd: 4200,
    status: "success",
    txHash: "simulated:dist-jul05",
    createdAt: "2026-07-05T00:00:00Z",
  },
  // --- Withdraw ---
  {
    id: "tx-withdraw-jul01",
    kind: "withdraw",
    userId: USER.id,
    amountUsd: -1000000,
    tonAmount: 5000000000,
    status: "success",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-01T09:00:00Z",
  },
  {
    id: "tx-withdraw-pending",
    kind: "withdraw",
    userId: USER.id,
    amountUsd: -500000,
    tonAmount: 2500000000,
    status: "pending",
    txHash: makeSyntheticTxHash(),
    createdAt: "2026-07-25T11:15:00Z",
  },
];