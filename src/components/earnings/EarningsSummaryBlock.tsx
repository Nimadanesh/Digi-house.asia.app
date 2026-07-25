"use client";
// File responsibility: Earnings summary readout block. DESIGN_SYSTEM Pillar 3 + §"Earnings summary block":
// the this-week projected payout is the emotional hero — render it at near-hero size with the
// Pending pill above it. All-time earned + payout countdown stay normal rows.
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { SectionLabel } from "@/components/common/SectionLabel";
import { StatusPill } from "@/components/common/StatusPill";
import { usd } from "@/lib/format";
import { PayoutCountdown } from "./PayoutCountdown";
import type { EarningsSummary } from "@/types/earnings";

export function EarningsSummaryBlock({ summary }: { summary: EarningsSummary }) {
  return (
    <div className="space-y-3">
      {/* Hero sub-block (Pillar 3): the next payout is the reason the user opens the app. */}
      <Block className="p-4">
        <div className="flex items-center justify-between">
          <SectionLabel>This week projected</SectionLabel>
          <StatusPill label="Pending" variant="warning" />
        </div>
        <p className="mt-2 text-[1.625rem] font-bold tracking-[-0.02em] tnum text-foreground">
          {usd(summary.thisWeekProjectedUsd)}
        </p>
      </Block>

      {/* Secondary readout block: all-time earned + payout countdown. */}
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">All-time earned</span>
          <span className="ml-auto text-sm tnum text-foreground font-semibold">{usd(summary.allTimeUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Payout</span>
          <span className="ml-auto"><PayoutCountdown /></span>
        </Row>
      </Block>
    </div>
  );
}