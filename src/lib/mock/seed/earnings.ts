// File responsibility: weekly-transfer entries (paid with synthetic txHash; pending without).
// Amounts are weekly-settlement tape (transfer batches), always labeled through the
// monthly presentation contract in UI. shareRatio is the canonical V1 ownership
// fraction (Syrene 160/120,000; Villa du Cap 200/250,000 — Final PO Decision 1).
import type { EarningsEntry } from "@/types/earnings";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
import { USER } from "./user";
import { PAYOUT_SYRENE, PAYOUT_VILLA_DU_CAP, TON_SYRENE, TON_VILLA_DU_CAP, WEEKS } from "./holdings";

// 8 entries: 6 paid (weeks 1-3) + 2 pending (week 4, most recent).
export const EARNINGS_ENTRIES: EarningsEntry[] = [
  {
    id: "earn-re-108924-2026-06-29",
    userId: USER.id,
    propertyId: "re-108924",
    weekOf: WEEKS[0],
    amountUsd: PAYOUT_SYRENE,
    tonAmount: TON_SYRENE,
    shareRatio: 160 / 120000,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-re-123861-2026-06-29",
    userId: USER.id,
    propertyId: "re-123861",
    weekOf: WEEKS[0],
    amountUsd: PAYOUT_VILLA_DU_CAP,
    tonAmount: TON_VILLA_DU_CAP,
    shareRatio: 200 / 250000,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-re-108924-2026-07-06",
    userId: USER.id,
    propertyId: "re-108924",
    weekOf: WEEKS[1],
    amountUsd: PAYOUT_SYRENE,
    tonAmount: TON_SYRENE,
    shareRatio: 160 / 120000,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-re-123861-2026-07-06",
    userId: USER.id,
    propertyId: "re-123861",
    weekOf: WEEKS[1],
    amountUsd: PAYOUT_VILLA_DU_CAP,
    tonAmount: TON_VILLA_DU_CAP,
    shareRatio: 200 / 250000,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-re-108924-2026-07-13",
    userId: USER.id,
    propertyId: "re-108924",
    weekOf: WEEKS[2],
    amountUsd: PAYOUT_SYRENE,
    tonAmount: TON_SYRENE,
    shareRatio: 160 / 120000,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-re-123861-2026-07-13",
    userId: USER.id,
    propertyId: "re-123861",
    weekOf: WEEKS[2],
    amountUsd: PAYOUT_VILLA_DU_CAP,
    tonAmount: TON_VILLA_DU_CAP,
    shareRatio: 200 / 250000,
    status: "paid",
    txHash: makeSyntheticTxHash(),
  },
  {
    id: "earn-re-108924-2026-07-20",
    userId: USER.id,
    propertyId: "re-108924",
    weekOf: WEEKS[3],
    amountUsd: PAYOUT_SYRENE,
    tonAmount: TON_SYRENE,
    shareRatio: 160 / 120000,
    status: "pending",
  },
  {
    id: "earn-re-123861-2026-07-20",
    userId: USER.id,
    propertyId: "re-123861",
    weekOf: WEEKS[3],
    amountUsd: PAYOUT_VILLA_DU_CAP,
    tonAmount: TON_VILLA_DU_CAP,
    shareRatio: 200 / 250000,
    status: "pending",
  },
];
