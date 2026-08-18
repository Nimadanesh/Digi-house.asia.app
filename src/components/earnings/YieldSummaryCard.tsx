"use client";
// File responsibility: Locked-share yield card on Earnings (PRODUCT-PLAN §0.4 / PB-10) —
// monthly ↔ weekly comparison, accrued-unpaid figure, and the yield payment list.
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import type { YieldSummary } from "@/types/lock";
import { usd } from "@/lib/format";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function YieldSummaryCard({ summary }: { summary: YieldSummary }) {
  const t = useTranslations("earnings");
  const hasPayments = summary.payments.length > 0;

  return (
    <section className="space-y-2" data-testid="yield-summary-card">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("yieldTitle")}
      </h2>
      <Block className="p-4 space-y-4">
        {summary.activeLocks === 0 ? (
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {t("yieldNoLocks")}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Lock size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground tnum">
                  {summary.lockedShares} shares
                </span>
              </div>
              <span className="text-sm font-semibold tnum text-success" data-testid="yield-accrued-unpaid">
                {usd(summary.accruedUnpaidUsd)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
              <div>
                <p className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">
                  {t("yieldMonthly")}
                </p>
                <p className="text-sm font-semibold tnum text-foreground" data-testid="yield-monthly">
                  {usd(summary.projectedMonthlyUsd)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">
                  {t("yieldWeekly")}
                </p>
                <p className="text-sm font-semibold tnum text-foreground" data-testid="yield-weekly">
                  {usd(summary.projectedWeeklyUsd)} × 4
                </p>
              </div>
            </div>
          </>
        )}
      </Block>

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
