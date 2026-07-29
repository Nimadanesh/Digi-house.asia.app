"use client";
// File responsibility: one Payments list row — collapse shows photo/name/date/amount/Paid stipend;
// expand shows integrity math + discrete demo disclaimer (Fable Earnings §Payments).
// "simulated" capsule appears on collapsed row only when the hash is synthetic AND per ADR-001 §4.
import { useState } from "react";
import Image from "next/image";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { usd, ton, weekLabel, pct } from "@/lib/format";
import { DEMO_TX_DISCLAIMER } from "@/lib/constants";
import type { EarningsEntry } from "@/types/earnings";
import { haptics } from "@/lib/telegram/haptics";
import { cn } from "@/lib/utils";
import {
  canShowExplorerLink,
  shouldShowSimulatedBadge,
  buildExplorerTxUrl,
} from "@/lib/settlement/honesty";
import { env } from "@/lib/env";

const THUMB = "size-9 shrink-0 rounded-[10px] overflow-hidden bg-surface-2 relative";

export function EarningsEntryRow({
  entry,
  propertyName,
  propertyImage,
  weeklyRentPoolUsd,
  sharesOwned,
}: {
  entry: EarningsEntry;
  propertyName: string;
  propertyImage?: string;
  weeklyRentPoolUsd: number;
  sharesOwned?: number;
}) {
  const [open, setOpen] = useState(false);
  const network = env.network;
  const showSimulated = shouldShowSimulatedBadge(entry.txHash, entry.status, network);
  const showExplorer = canShowExplorerLink(entry.txHash, network);
  const explorerUrl = entry.txHash ? buildExplorerTxUrl(entry.txHash, network) : null;

  return (
    <>
      <Row className="!min-h-[56px] py-2">
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            setOpen((v) => !v);
          }}
          className="flex w-full min-w-0 flex-1 items-center gap-3 text-left"
          aria-expanded={open}
          data-testid={`earnings-row-${entry.id}`}
        >
          <div className={THUMB} aria-hidden>
            {propertyImage ? (
              <Image src={propertyImage} alt="" fill className="object-cover" sizes="36px" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[0.9375rem] font-medium leading-tight text-foreground">
              {propertyName}
            </div>
            <div className="mt-0.5 text-[0.8125rem] leading-snug text-muted-foreground">
              {weekLabel(entry.weekOf)}
            </div>
          </div>
          <div className="shrink-0 text-right space-y-0.5">
            <div className="tnum text-[0.9375rem] font-semibold leading-tight text-foreground">
              {usd(entry.amountUsd)}
            </div>
            {entry.status === "paid" ? (
              <StatusPill label="Paid" variant="success" simulated={showSimulated} />
            ) : (
              <StatusPill label="Pending" variant="warning" />
            )}
          </div>
          <ChevronDown
            size={18}
            strokeWidth={1.75}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform duration-200 ease-out",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </Row>
      {open ? (
        <div className="mx-4 border-t border-border" data-testid="earnings-disclosure">
          <div className="flex gap-3 py-3">
            <div className={THUMB} aria-hidden data-testid="earnings-disclosure-lead" />
            <div className="min-w-0 flex-1 space-y-2 text-[0.8125rem]">
              {sharesOwned != null ? (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">Shares owned</span>
                  <span className="tnum shrink-0 text-foreground">{sharesOwned}</span>
                </div>
              ) : null}
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">Your share</span>
                <span className="tnum shrink-0 text-foreground">{pct(entry.shareRatio)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">Rental pool</span>
                <span className="tnum shrink-0 text-foreground">{usd(weeklyRentPoolUsd)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">Calculation</span>
                <span className="tnum shrink-0 text-foreground text-right">
                  {usd(weeklyRentPoolUsd)} × {pct(entry.shareRatio)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">Your payout</span>
                <span className="tnum shrink-0 font-semibold text-foreground">{usd(entry.amountUsd)}</span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-muted-foreground">TON equivalent</span>
                <span className="tnum shrink-0 text-foreground">{ton(BigInt(entry.tonAmount))}</span>
              </div>
              {entry.status === "paid" && entry.txHash ? (
                <div className="space-y-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-muted-foreground">Tx hash</span>
                    {showExplorer && explorerUrl ? (
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tnum shrink-0 max-w-[55%] truncate text-primary inline-flex items-center gap-1 hover:underline"
                        data-testid="earnings-explorer-link"
                      >
                        {entry.txHash}
                        <ExternalLink size={12} strokeWidth={1.75} aria-hidden />
                      </a>
                    ) : (
                      <span className="tnum shrink-0 text-foreground max-w-[55%] truncate">
                        {entry.txHash}
                      </span>
                    )}
                  </div>
                  {!showExplorer ? (
                    <p className="leading-snug text-muted-foreground text-[0.6875rem]" data-testid="earnings-row-disclaimer">
                      {DEMO_TX_DISCLAIMER}. Simulated payout · tx hash is a placeholder.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
