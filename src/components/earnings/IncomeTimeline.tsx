"use client";
// File responsibility: Earnings money-flow timeline (redesign) — Paid → Accruing → Next estimated.
// Pure display: aggregates existing fields via payout-display helpers, never new financial math.
// The next payout date reuses the exact Sunday display rule (payout-display::nextPayoutDate).
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
}: {
  entries: EarningsEntry[];
  /** Estimated next payout, integer minor units (repo contract). */
  projectedNextUsd: number;
}) {
  const t = useTranslations("earnings");

  const pool = weeklyEarningsPool(entries);
  const lastPaidWeek = lastPaidWeekOf(entries);
  // Accruing = all pending (projected current) entries summed.
  const accruingUsd = entries.reduce((s, e) => (e.status === "pending" ? s + e.amountUsd : s), 0);
  const nowMs = useSharedNowMs();
  const paidUsd = lastPaidWeek ? pool.get(lastPaidWeek)?.totalUsd ?? 0 : 0;
  const paidLabel = lastPaidWeek ? weekLabel(lastPaidWeek) : "—";
  const nextDate = nextPayoutDate(nowMs);
  const nextWhen = formatPayoutDate(nextDate);

  const rows = [
    {
      key: "paid",
      label: t("timelinePaid"),
      sub: paidLabel,
      amount: paidUsd,
      variant: "success" as const,
      testId: "timeline-paid",
    },
    {
      key: "accruing",
      label: t("timelineAccruing"),
      sub: t("timelineAccruingSub"),
      amount: accruingUsd,
      variant: "warning" as const,
      testId: "timeline-accruing",
    },
    {
      key: "next",
      label: t("timelineNext"),
      sub: nextWhen,
      amount: projectedNextUsd,
      variant: "default" as const,
      testId: "timeline-next",
    },
  ] as const;

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
      <p className="px-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
        {t("timelineCaption")}
      </p>
    </section>
  );
}