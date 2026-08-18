"use client";

import type { Transaction } from "@/types/transaction";
import { Block } from "@/components/common/Block";
import { TransactionRow } from "./TransactionRow";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

function SkeletonRow() {
  return (
    <div className="flex min-h-[48px] items-center gap-2 mx-4 border-t border-border first:border-t-0 animate-pulse">
      <div className="h-5 w-5 rounded-full bg-muted" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="h-3.5 w-24 rounded bg-muted" />
        <div className="h-3 w-16 rounded bg-muted" />
      </div>
      <div className="h-3.5 w-16 rounded bg-muted" />
      <div className="h-5 w-14 rounded bg-muted" />
    </div>
  );
}

type TransactionListProps = {
  transactions: Transaction[];
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
};

export function TransactionList({
  transactions,
  isLoading,
  isError,
  error,
  hasMore,
  onLoadMore,
  onRetry,
}: TransactionListProps) {
  if (isLoading && transactions.length === 0) {
    return (
      <section>
        <h2 className="px-1 text-[0.9375rem] font-semibold text-foreground">
          Transaction history
        </h2>
        <Block>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </Block>
      </section>
    );
  }

  if (isError && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">
          {error?.message ?? "Could not load transactions"}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <p className="text-sm text-muted-foreground">No transactions yet</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="px-1 text-[0.9375rem] font-semibold text-foreground">
        Transaction history
      </h2>
      <Block>
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </Block>

      {hasMore && (
        <div className="px-1 pt-3">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-2 py-3 text-sm font-medium text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Show more
          </button>
        </div>
      )}

      {isLoading && transactions.length > 0 && (
        <div className="flex justify-center py-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </section>
  );
}
