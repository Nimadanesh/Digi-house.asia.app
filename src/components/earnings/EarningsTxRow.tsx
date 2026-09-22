"use client";
// File responsibility: ONE premium transaction row on Earnings — TaskRows grammar
// (icon tile + label/basis left, amount + status badge right, chevron; expandable
// detail in a surface-2 inset). Presentational: the transaction arrives via props.
import { useState } from "react";
import type { Transaction, TxKind } from "@/types/transaction";
import { StatusPill } from "@/components/common/StatusPill";
import { canShowExplorerLink, buildExplorerTxUrl } from "@/lib/settlement/honesty";
import { env } from "@/lib/env";
import { usd, ton } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<TxKind, typeof ArrowDownCircle> = {
  buy: ArrowDownCircle,
  sell: ArrowUpCircle,
  earnings: DollarSign,
  withdraw: ArrowLeft,
  instant_sell: ArrowUpCircle,
  trade_buy: ArrowDownCircle,
  trade_sell: ArrowUpCircle,
  yield_monthly: DollarSign,
  yield_weekly: DollarSign,
};

const KIND_TILE: Record<TxKind, string> = {
  buy: "bg-success/12 text-success",
  sell: "bg-danger/10 text-danger",
  earnings: "bg-primary/12 text-primary",
  withdraw: "bg-surface-2 text-muted-foreground",
  instant_sell: "bg-danger/10 text-danger",
  trade_buy: "bg-success/12 text-success",
  trade_sell: "bg-danger/10 text-danger",
  yield_monthly: "bg-primary/12 text-primary",
  yield_weekly: "bg-primary/12 text-primary",
};

const KIND_LABEL: Record<TxKind, string> = {
  buy: "Buy",
  sell: "Sell",
  earnings: "Earnings",
  withdraw: "Withdraw",
  instant_sell: "Instant sell",
  trade_buy: "Trade buy",
  trade_sell: "Trade sell",
  yield_monthly: "Monthly yield",
  // Slice 4: profit is described as monthly even when the payout process used
  // weekly installments (contract) — the ledger kind is preserved in data.
  yield_weekly: "Yield",
};

export function EarningsTxRow({ transaction }: { transaction: Transaction }) {
  const [expanded, setExpanded] = useState(false);
  const tx = transaction;
  const network = env.network;
  const Icon = KIND_ICON[tx.kind];
  const showExplorer = tx.txHash ? canShowExplorerLink(tx.txHash, network) : false;
  const explorerUrl = tx.txHash ? buildExplorerTxUrl(tx.txHash, network) : null;
  const date = new Date(tx.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div data-testid={`earnings-tx-row-${tx.id}`}>
      <button
        type="button"
        onClick={() => {
          haptics.selection();
          setExpanded((v) => !v);
        }}
        aria-expanded={expanded}
        className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-start transition-transform duration-200 ease-out active:scale-[0.99]"
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-[10px]",
            KIND_TILE[tx.kind],
          )}
          aria-hidden
        >
          <Icon size={17} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.9375rem] font-medium leading-snug text-foreground">
            {KIND_LABEL[tx.kind] ?? tx.kind}
          </span>
          <span className="mt-[2px] block truncate text-[0.8125rem] leading-relaxed text-muted-foreground">
            {tx.propertyTitle ? `${tx.propertyTitle} · ${date}` : date}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="whitespace-nowrap text-[0.9375rem] tnum font-semibold tracking-tight text-foreground">
            {usd(tx.amountUsd)}
          </span>
          <StatusPill
            label={tx.status === "success" ? "Success" : tx.status === "pending" ? "Pending" : "Failed"}
            variant={tx.status === "success" ? "success" : tx.status === "pending" ? "warning" : "danger"}
          />
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground/80 transition-transform duration-200 ease-out",
            expanded && "rotate-180",
          )}
        />
      </button>
      {expanded ? (
        <div className="mx-4 mb-3 rounded-[8px] bg-surface-2/70 px-3 py-2.5 ring-1 ring-border/30">
          <div className="space-y-1">
            {tx.txHash ? (
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                <span className="min-w-0 truncate text-xs text-muted-foreground">Tx hash</span>
                {showExplorer && explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex max-w-[160px] items-center gap-1 text-xs font-semibold text-primary"
                  >
                    <span className="truncate font-mono">{tx.txHash}</span>
                    <ExternalLink size={12} strokeWidth={2} aria-hidden className="shrink-0" />
                  </a>
                ) : (
                  <span className="max-w-[160px] truncate font-mono text-xs tnum font-semibold text-foreground">
                    {tx.txHash}
                  </span>
                )}
              </div>
            ) : null}
            {tx.shares != null ? (
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                <span className="min-w-0 truncate text-xs text-muted-foreground">Shares</span>
                <span className="shrink-0 whitespace-nowrap text-xs tnum font-semibold tracking-tight text-foreground">
                  {tx.shares}
                </span>
              </div>
            ) : null}
            {tx.tonAmount != null ? (
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                <span className="min-w-0 truncate text-xs text-muted-foreground">TON amount</span>
                <span className="shrink-0 whitespace-nowrap text-xs tnum font-semibold tracking-tight text-foreground">
                  {ton(BigInt(tx.tonAmount))}
                </span>
              </div>
            ) : null}
            {tx.feeUsd != null ? (
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                <span className="min-w-0 truncate text-xs text-muted-foreground">Fee</span>
                <span className="shrink-0 whitespace-nowrap text-xs tnum font-semibold tracking-tight text-foreground">
                  {usd(tx.feeUsd)}
                </span>
              </div>
            ) : null}
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
              <span className="min-w-0 truncate text-xs text-muted-foreground">Date</span>
              <span className="shrink-0 whitespace-nowrap text-xs tnum font-semibold tracking-tight text-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
            {tx.error ? (
              <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
                <span className="min-w-0 truncate text-xs text-muted-foreground">Error</span>
                <span className="max-w-[200px] text-right text-xs text-danger">{tx.error}</span>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
