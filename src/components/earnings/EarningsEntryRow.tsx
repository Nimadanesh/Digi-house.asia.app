"use client";
// File responsibility: one Earnings entry row, tap-expandable to reveal the proportional-math line
// (R-6.6 integrity display) and the simulated-payout disclosure. DESIGN_SYSTEM §"Earnings row".
// Property name + weekly rent pool are passed in (page builds the lookup maps) — components never
// import lib/mock.
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { usd, ton, weekLabel, pct } from "@/lib/format";
import type { EarningsEntry } from "@/types/earnings";

export function EarningsEntryRow({
  entry,
  propertyName,
  weeklyRentPoolUsd,
}: {
  entry: EarningsEntry;
  propertyName: string;
  weeklyRentPoolUsd: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Row className="!min-h-[56px]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex-1 flex items-center gap-3 text-left"
          aria-expanded={open}
        >
          <div className="size-9 rounded-[10px] bg-surface-2 shrink-0" aria-hidden />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{propertyName}</div>
            <div className="text-xs text-muted-foreground">{weekLabel(entry.weekOf)}</div>
          </div>
          <div className="text-right">
            <div className="text-[0.9375rem] font-semibold tnum text-foreground">{usd(entry.amountUsd)}</div>
            <div className="text-xs text-muted-foreground tnum">{ton(BigInt(entry.tonAmount))}</div>
          </div>
          <div className="ml-2 shrink-0">
            {entry.status === "paid" ? (
              // MVP honesty: every Paid pill carries the muted "simulated" sibling capsule, never finance-colored.
              <StatusPill label="Paid" variant="success" simulated />
            ) : (
              <StatusPill label="Pending" variant="warning" />
            )}
          </div>
          <ChevronDown
            size={20}
            strokeWidth={1.75}
            className={`text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </Row>
      {open ? (
        // Proportional-math disclosure (R-6.6 display). The 48px lead spacer mirrors the row's
        // thumb (size-9=36) + gap-3 (12) so the disclosure content aligns with the property NAME
        // column (native iOS expandable-row pattern). The border-t hairline stays full-width-inset
        // (mx-4 = 16px), matching the sibling rows. Static expand — no keyframe animation
        // (DESIGN_SYSTEM §"What we do NOT animate").
        <div className="mx-4 flex border-t border-border">
          <div className="w-[48px] shrink-0" aria-hidden />
          <div className="flex-1 py-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your share</span>
              <span className="tnum text-foreground">{pct(entry.shareRatio)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Weekly rent pool</span>
              <span className="tnum text-foreground">{usd(weeklyRentPoolUsd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your payout (pool × share)</span>
              <span className="tnum text-foreground font-semibold">{usd(entry.amountUsd)}</span>
            </div>
            {entry.status === "paid" && entry.txHash ? (
              <p className="pt-1 text-muted-foreground">
                Simulated payout · tx hash is a placeholder <span className="tnum">({entry.txHash.slice(0, 28)}…)</span>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}