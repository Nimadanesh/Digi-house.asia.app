// File responsibility: pure client-side transaction kind filter (no React).
// Legacy 'sell'/'earnings' rows fold into their new homes (trade / yield) so the
// filters keep working across pre-PE-09 data.
import type { Transaction, TxKind } from "@/types/transaction";

export type TransactionChip =
  | "all"
  | "buy"
  | "instant_sell"
  | "trade"
  | "yield"
  | "withdraw";

/** Chip ids only — labels live in TransactionFilterChips (transactions page is English). */
export const TRANSACTION_CHIP_IDS: readonly TransactionChip[] = [
  "all",
  "buy",
  "instant_sell",
  "trade",
  "yield",
  "withdraw",
] as const;

/** Map a raw ledger kind to its filter category. */
function kindCategory(kind: TxKind): Exclude<TransactionChip, "all"> {
  switch (kind) {
    case "buy":
      return "buy";
    case "instant_sell":
      return "instant_sell";
    case "trade_buy":
    case "trade_sell":
    case "sell":
      return "trade";
    case "yield_monthly":
    case "yield_weekly":
    case "earnings":
      return "yield";
    case "withdraw":
      return "withdraw";
  }
}

export function filterTransactions(
  transactions: Transaction[],
  chip: TransactionChip = "all",
): Transaction[] {
  if (chip === "all") return transactions;
  return transactions.filter((tx) => kindCategory(tx.kind) === chip);
}
