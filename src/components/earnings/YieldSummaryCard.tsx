"use client";
// File responsibility: Locked-share yield card on Earnings (PRODUCT-PLAN §0.4 / PB-10) —
// monthly projection, accrued-unpaid figure, withdrawal terms, and the yield payment list.
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
            <div data-testid="yield-accrued-block">
              <p className="text-[0.6875rem] leading-snug text-muted-foreground">{t("yieldAccrued")}</p>
              <p
                className="mt-1 text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum text-success"
                data-testid="yield-accrued-unpaid"
              >
                {usd(summary.accruedUnpaidUsd)}
              </p>
              <p className="mt-1.5 text-[0.6875rem] leading-snug text-muted-foreground">
                {t("yieldAccruedSub")}
              </p>
            </div>
            <div className="flex items-center gap-2 min-w-0 border-t border-border pt-3">
              <Lock size={16} strokeWidth={1.75} className="shrink-0 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground tnum">
                {summary.lockedShares} shares
              </span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-[0.6875rem] leading-snug text-muted-foreground">
                  {t("yieldMonthly")}
                </p>
                <p className="text-sm font-semibold tnum text-foreground" data-testid="yield-monthly">
                  {usd(summary.projectedMonthlyUsd)}
                </p>
              </div>
              <p className="text-[0.6875rem] leading-snug text-muted-foreground">
                {t("withdrawalTerms")}
              </p>
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
