"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTransactions } from "@/hooks/useTransactions";
import { useTelegram } from "@/hooks/useTelegram";
import { TransactionList } from "@/components/transactions/TransactionList";
import { haptics } from "@/lib/telegram/haptics";

export default function TransactionsPage() {
  const router = useRouter();
  const { transactions, isLoading, isError, error, hasMore, loadMore, refetch } = useTransactions();
  const { backButton } = useTelegram();

  useEffect(() => {
    try {
      backButton.show();
    } catch { /* ignore */ }
    let off: () => void = () => {};
    try {
      off = backButton.onClick(() => {
        haptics.selection();
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
      <TransactionList
        transactions={transactions}
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
