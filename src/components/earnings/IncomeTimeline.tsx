"use client";
// File responsibility: Income money-flow timeline (Phase 9 Slice 5 — UI Mapping §7.1/§7.3).
// Rows carry status words only — Paid / Accrued / Expected — never a frequency promise
// (§7.3 rule 1). Paid shows the actual paid amount + its actual week (rule 3); Accrued
// sources the lock accrued-unpaid figure from the repo contract (hidden when no lock data
// exists — never a fake zero); Expected uses the pending-only figure + the Sunday display
// rule date (payout-display::nextPayoutDate). Pure display; no new financial math.
import { useTranslations } from "next-intl";
import { usd, weekLabel } from "@/lib/format";
import {
  nextPayoutDate,
  formatPayoutDate,
  lastPaidWeekOf,
  weeklyEarningsPool,
} from "@/lib/payout-display";
import { useSharedNowMs } from "@/hooks/useSharedNowMs";
import { Block } from "@/components/common/Block";
import type { EarningsEntry } from "@/types/earnings";

export function IncomeTimeline({
  entries,
  projectedNextUsd,
  accruedUsd,
}: {
  entries: EarningsEntry[];
  /** Expected next distribution, integer minor units (repo contract, pending entries only). */
  projectedNextUsd: number;
  /** Accrued-unpaid figure from the repo yield block; row hidden when no lock data exists. */
  accruedUsd?: number;
}) {
  const t = useTranslations("earnings");

  const pool = weeklyEarningsPool(entries);
  const lastPaidWeek = lastPaidWeekOf(entries);
  const nowMs = useSharedNowMs();
  const paidUsd = lastPaidWeek ? pool.get(lastPaidWeek)?.totalUsd ?? 0 : 0;
  const paidLabel = lastPaidWeek ? weekLabel(lastPaidWeek) : "—";
  const nextDate = nextPayoutDate(nowMs);
  const nextWhen = formatPayoutDate(nextDate);

  const rows: {
    key: string;
    label: string;
    sub: string;
    amount: number;
    variant: "success" | "warning" | "default";
    testId: string;
  }[] = [
    {
      key: "paid",
      label: t("timelinePaid"),
      sub: paidLabel,
      amount: paidUsd,
      variant: "success",
      testId: "timeline-paid",
    },
  ];

  if (accruedUsd !== undefined) {
    rows.push({
      key: "accrued",
      label: t("timelineAccrued"),
      sub: t("timelineAccruedSub"),
      amount: accruedUsd,
      variant: "warning",
      testId: "timeline-accrued",
    });
  }

  // Hide when no pending entries exist — never a fake "$0 Expected" (UI Mapping §7.1).
  if (projectedNextUsd > 0) {
    rows.push({
      key: "next",
      label: t("timelineNext"),
      sub: nextWhen,
      amount: projectedNextUsd,
      variant: "default",
      testId: "timeline-next",
    });
  }
  return (
    <section className="space-y-2" data-testid="income-timeline">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("timelineTitle")}</h2>
      <Block data-testid="income-timeline-block">
        <div className="p-4 space-y-3">
          {rows.map((r) => (
            <div className="flex items-center gap-3" key={r.key} data-testid={r.testId}>
              <span
                className={
                  "flex size-2.5 shrink-0 items-center justify-center rounded-full " +
                  (r.variant === "success"
                    ? "bg-success"
                    : r.variant === "warning"
                      ? "bg-warning"
                      : "bg-primary/40")
                }
                aria-hidden
              />
              <div className="flex min-w-0 flex-1 items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.label}</p>
                  <p className="mt-0.5 text-[0.6875rem] leading-snug text-muted-foreground">
                    {r.sub}
                  </p>
                </div>
                <p
                  className={
                    "shrink-0 text-sm font-semibold tnum " +
                    (r.variant === "success"
                      ? "text-success"
                      : r.variant === "warning"
                        ? "text-warning"
                        : "text-foreground")
                  }
                >
                  {usd(r.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Block>
    </section>
  );
}
