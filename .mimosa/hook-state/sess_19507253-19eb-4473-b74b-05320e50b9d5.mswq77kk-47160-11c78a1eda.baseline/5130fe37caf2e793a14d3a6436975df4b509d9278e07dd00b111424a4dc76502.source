"use client";

import { useState } from "react";
import type { Transaction, TxKind } from "@/types/transaction";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { isRealTxHash, canShowExplorerLink, buildExplorerTxUrl } from "@/lib/settlement/honesty";
import { env } from "@/lib/env";
import { usd, ton } from "@/lib/format";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, ArrowLeft, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

const KIND_ICON: Record<TxKind, typeof ArrowDownCircle> = {
  buy: ArrowDownCircle,
  sell: ArrowUpCircle,
  earnings: DollarSign,
  withdraw: ArrowLeft,
};

const KIND_COLOR: Record<TxKind, string> = {
  buy: "text-success",
  sell: "text-destructive",
  earnings: "text-primary",
  withdraw: "text-muted-foreground",
};

const KIND_LABEL: Record<TxKind, string> = {
  buy: "Buy",
  sell: "Sell",
  earnings: "Earnings",
  withdraw: "Withdraw",
};

function showSimulatedTxBadge(
  txHash: string | undefined | null,
  status: string,
): boolean {
  if (status !== "success") return false;
  if (!txHash) return true;
  return !isRealTxHash(txHash);
}

type TransactionRowProps = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const [expanded, setExpanded] = useState(false);
  const tx = transaction;
  const network = env.network;
  const Icon = KIND_ICON[tx.kind];
  const color = KIND_COLOR[tx.kind];
  const simulated = showSimulatedTxBadge(tx.txHash, tx.status);
  const showExplorer = tx.txHash ? canShowExplorerLink(tx.txHash, network) : false;
  const explorerUrl = tx.txHash ? buildExplorerTxUrl(tx.txHash, network) : null;

  return (
    <div>
      <Row onClick={() => setExpanded((v) => !v)}>
        <Icon className={`h-5 w-5 shrink-0 ${color}`} strokeWidth={1.75} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-foreground">
            {KIND_LABEL[tx.kind] ?? tx.kind}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {tx.propertyTitle ? (
              <span className="truncate">{tx.propertyTitle}</span>
            ) : (
              <span className="italic">&mdash;</span>
            )}
          </span>
        </div>
        <span className="text-right tabular-nums text-sm font-semibold text-foreground">
          {usd(tx.amountUsd)}
        </span>
        <div className="flex items-center gap-1">
          <StatusPill
            label={tx.status === "success" ? "Success" : tx.status === "pending" ? "Pending" : "Failed"}
            variant={tx.status === "success" ? "success" : tx.status === "pending" ? "warning" : "danger"}
            simulated={simulated}
          />
          {expanded ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      </Row>
      {expanded && (
        <div className="mx-4 border-t border-border px-1 py-3">
          <div className="space-y-2 text-xs text-muted-foreground">
            {tx.txHash && (
              <div className="flex items-center justify-between">
                <span>Tx hash</span>
                {showExplorer && explorerUrl ? (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary"
                  >
                    <span className="max-w-[160px] truncate font-mono">{tx.txHash}</span>
                    <ExternalLink size={12} strokeWidth={2} />
                  </a>
                ) : (
                  <span className="max-w-[200px] truncate font-mono text-foreground">
                    {tx.txHash}
                  </span>
                )}
              </div>
            )}
            {tx.shares != null && (
              <div className="flex justify-between">
                <span>Shares</span>
                <span className="tabular-nums text-foreground">{tx.shares}</span>
              </div>
            )}
            {tx.tonAmount != null && (
              <div className="flex justify-between">
                <span>TON amount</span>
                <span className="tabular-nums text-foreground">{ton(BigInt(tx.tonAmount))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Date</span>
              <span className="tabular-nums text-foreground">
                {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
            {tx.error && (
              <div className="flex justify-between">
                <span>Error</span>
                <span className="text-destructive max-w-[200px] text-right">{tx.error}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
