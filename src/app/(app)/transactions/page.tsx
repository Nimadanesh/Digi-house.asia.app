"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useTelegram } from "@/hooks/useTelegram";
import { TransactionList } from "@/components/transactions/TransactionList";
import { TransactionFilterChips } from "@/components/transactions/TransactionFilterChips";
import { filterTransactions, type TransactionChip } from "@/lib/transaction-filter";
import { haptics } from "@/lib/telegram/haptics";
import { closeTopSheet } from "@/components/common/Sheet";

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, isLoading, isError, error, hasMore, loadMore, refetch } = useTransactions();
  const { backButton } = useTelegram();
  const [chip, setChip] = useState<TransactionChip>("all");
  const filtered = filterTransactions(transactions, chip);

  useEffect(() => {
    try {
      backButton.show();
    } catch { /* ignore */ }
    let off: () => void = () => {};
    try {
      off = backButton.onClick(() => {
        haptics.selection();
        // A global sheet (e.g. Settings) opened over this page owns the back press first.
        if (closeTopSheet()) return;
        router.back();
      });
    } catch { /* ignore */ }
    return () => {
      off();
    };
  }, [backButton, router]);

  useEffect(() => {
    return () => {
      try { backButton.hide(); } catch { /* ignore */ }
    };
  }, [backButton]);

  return (
    <div className="space-y-4 pb-6">
      <TransactionFilterChips
        value={chip}
        onChange={setChip}
        onSelectHaptic={() => haptics.selection()}
      />
      <TransactionList
        transactions={filtered}
        isLoading={isLoading}
        isError={isError}
        error={error}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onRetry={() => {
          haptics.impact("light");
          void refetch();
        }}
      />
    </div>
  );
}
