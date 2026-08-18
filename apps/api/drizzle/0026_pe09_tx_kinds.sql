-- PRODUCT-PLAN Phase E (PE-09) — transactions.kind expansion:
-- the ledger distinguishes instant sells, secondary-market trades, and monthly/weekly
-- yield from plain buys/sells/earnings so the Transactions page can render distinct
-- kinds + fee lines + filters. Legacy 'sell'/'earnings' values are retained for
-- pre-existing rows; new writes use the specific kinds.
ALTER TABLE "transactions" DROP CONSTRAINT IF EXISTS "transactions_kind_check";
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_kind_check" CHECK ("kind" IN ('buy', 'sell', 'earnings', 'withdraw', 'instant_sell', 'trade_buy', 'trade_sell', 'yield_monthly', 'yield_weekly'));
