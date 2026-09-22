"use client";
// File responsibility: recent transaction history preview on Earnings (latest 5 + View all).
// Presentational: transactions arrive via props (page wires useTransactions); rows use
// the premium EarningsTxRow (TaskRows grammar). No new financial logic.
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Block } from "@/components/common/Block";
import { EarningsTxRow } from "@/components/earnings/EarningsTxRow";
import type { Transaction } from "@/types/transaction";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";

const PREVIEW_COUNT = 3;

export function EarningsTransactionHistory({
  transactions = [],
  isLoading = false,
}: {
  transactions?: Transaction[];
  isLoading?: boolean;
}) {
  const t = useTranslations("earnings");
  if (!isLoading && transactions.length === 0) return null;
  const preview = transactions.slice(0, PREVIEW_COUNT);

  return (
    <section className="space-y-3" data-testid="earnings-tx-history">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">{t("txHistoryTitle")}</h2>
        <Link
          href={ROUTES.transactions}
          onClick={() => haptics.selection()}
          className="inline-flex min-h-[44px] items-center gap-0.5 text-[0.8125rem] font-semibold text-primary active:opacity-70 transition-opacity"
          data-testid="earnings-tx-view-all"
        >
          {t("txHistoryViewAll")}
          <ChevronRight size={16} strokeWidth={2} aria-hidden className="rtl:rotate-180" />
        </Link>
      </div>
      <Block className="overflow-hidden" data-testid="earnings-tx-list">
        <div className="divide-y divide-border/50">
          {preview.map((tx) => (
            <EarningsTxRow key={tx.id} transaction={tx} />
          ))}
        </div>
      </Block>
    </section>
  );
}
