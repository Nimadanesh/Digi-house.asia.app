"use client";
// File responsibility: Locked-share yield snapshot on Earnings (PRODUCT-PLAN §0.4 / PB-10) —
// quick-snapshot rows in the TaskRows grammar (one Block, hairline-separated rows,
// label + basis left, tabular value right — never truncated values). Accrued-unpaid,
// projected monthly, and locked-share count preserved. Pure display; no new financial logic.
import { useTranslations } from "next-intl";
import type { YieldSummary } from "@/types/lock";
import { usd } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function YieldSummaryCard({ summary }: { summary: YieldSummary }) {
  const t = useTranslations("earnings");
  const hasPayments = summary.payments.length > 0;

  return (
    <section className="space-y-3" data-testid="yield-summary-card">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("yieldTitle")}
      </h2>
      {summary.activeLocks === 0 ? (
        <Block className="p-5">
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {t("yieldNoLocks")}
          </p>
        </Block>
      ) : (
        <Block className="overflow-hidden" data-testid="yield-accrued-block">
          <div className="divide-y divide-border/50">
              <div className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[0.84375rem] leading-snug text-muted-foreground">
                    {t("yieldAccrued")}
                  </span>
                  <span className="mt-[2px] block text-xs leading-tight text-muted-foreground/80">
                    {t("yieldAccruedSub")}
                  </span>
                </span>
                <span
                  className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-success"
                  data-testid="yield-accrued-unpaid"
                >
                  {usd(summary.accruedUnpaidUsd)}
                </span>
              </div>
              <div className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[0.84375rem] leading-snug text-muted-foreground">
                    {t("yieldMonthly")}
                  </span>
                  <span className="mt-[2px] block text-xs leading-tight text-muted-foreground/80">
                    {t("withdrawalTerms")}
                  </span>
                </span>
                <span
                  className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
                  data-testid="yield-monthly"
                >
                  {usd(summary.projectedMonthlyUsd)}
                </span>
              </div>
              <div className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-0">
                  <span className="block text-[0.84375rem] leading-snug text-muted-foreground">
                    {t("lockedShares")}
                  </span>
                  <span className="mt-[2px] block text-xs leading-tight text-muted-foreground/80">
                    {t("lockedSharesSub")}
                  </span>
                </span>
                <span
                  className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
                  data-testid="yield-locked-shares"
                >
                  {t("lockedSharesValue", { count: summary.lockedShares })}
                </span>
              </div>
            </div>
          </Block>
      )}

      {hasPayments ? (
        <Block data-testid="yield-payments">
          {summary.payments.map((p) => (
            <Row key={p.id}>
              <div className="min-w-0 flex-1 space-y-1.5 pe-3">
                <p className="text-sm font-medium text-foreground tnum">
                  {usd(p.amountUsd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.kind === "final" ? t("yieldFinal") : t("yieldPayments")} · {p.periodEnd}
                </p>
              </div>
              <span className="shrink-0 text-xs tnum text-muted-foreground">
                {new Date(p.createdAt).toLocaleDateString()}
              </span>
            </Row>
          ))}
        </Block>
      ) : null}
    </section>
  );
}
