"use client";
// File responsibility: Earnings summary readout block (all-time + this-week projected + payout countdown).
// DESIGN_SYSTEM §"Earnings summary block". Pending pill uses StatusPill variant="warning".
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import { usd } from "@/lib/format";
import { PayoutCountdown } from "./PayoutCountdown";
import type { EarningsSummary } from "@/types/earnings";

export function EarningsSummaryBlock({ summary }: { summary: EarningsSummary }) {
  return (
    <Block>
      <Row>
        <span className="text-sm text-muted-foreground">All-time earned</span>
        <span className="ml-auto text-sm tnum text-foreground font-semibold">{usd(summary.allTimeUsd)}</span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">This week projected</span>
        <span className="ml-auto inline-flex items-center gap-2">
          <StatusPill label="Pending" variant="warning" />
          <span className="text-sm tnum text-foreground font-semibold">{usd(summary.thisWeekProjectedUsd)}</span>
        </span>
      </Row>
      <Row>
        <span className="text-sm text-muted-foreground">Payout</span>
        <span className="ml-auto"><PayoutCountdown /></span>
      </Row>
    </Block>
  );
}