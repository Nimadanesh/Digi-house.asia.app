"use client";
// File responsibility: Earn tab §1 — Your position investment calculator:
// shares stepper + projection-period selector driving the canonical
// presentation figures (Base-scenario monthly income; per-villa derived
// 12-month growth estimate prorated illustratively by months/12).
// No new economics: price via getPresentedPrimaryPrice, income via
// getPresentedMonthlyIncome, growth via getGrowthPotential. Unknown ids stay
// honest-pending. The Buy CTA lives in the page/sticky chrome, not this card.
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import {
  getPresentedMonthlyIncome,
  getPresentedPrimaryPrice,
} from "@/lib/economics/property-presentation";
import {
  formatGrowthPct,
  getGrowthPotential,
} from "@/lib/economics/estates/growth-potential";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { BorderBeam } from "border-beam";
import { Block } from "@/components/common/Block";
import { haptics } from "@/lib/telegram/haptics";

const MIN_SHARES = 1;
const MAX_SHARES = 100;

/** Projection periods supported by the existing 12-month illustrative model. */
const PROJECTION_MONTHS = [1, 3, 6, 9, 12] as const;
type ProjectionMonths = (typeof PROJECTION_MONTHS)[number];

export function YourPositionSection({
  v1,
  propertyId,
  onBuy,
}: {
  v1: FinancialModelV1PropertyModel | null;
  propertyId: string;
  /**
   * Kept for the parent contract — the buy CTA lives in the page/sticky
   * chrome, not inside this card (Slice G/H untouched).
   */
  onBuy: () => void;
}) {
  const t = useTranslations("property");
  const [shares, setShares] = useState(MIN_SHARES);
  const [months, setMonths] = useState<ProjectionMonths>(12);
  const monthly = getPresentedMonthlyIncome(propertyId);
  const currency = monthly.currency;
  const cur = (cents: number) => moneySmart(cents, currency);
  const priceCents = getPresentedPrimaryPrice();
  const investmentCents = shares * priceCents;
  // Per-villa derived growth estimate ((research upper − current) / current,
  // 1 decimal) applied to this position's investment — the canonical 12-month
  // illustrative figure. Shorter periods show the linear months/12 portion,
  // labeled illustrative alongside the canonical disclaimer.
  const growthPct = getGrowthPotential(propertyId)?.potentialPct ?? null;
  const growthTotalCents =
    growthPct != null ? Math.round((investmentCents * growthPct) / 100) : null;
  const growthPctText = formatGrowthPct(growthPct);
  const monthlyCents = monthly.cents != null ? monthly.cents * shares : null;
  const incomeReceivedCents = monthlyCents != null ? monthlyCents * months : null;
  const growthPeriodCents =
    growthTotalCents != null ? Math.round((growthTotalCents * months) / 12) : null;
  const shareValueCents =
    growthPeriodCents != null ? investmentCents + growthPeriodCents : null;
  const totalBenefitCents =
    incomeReceivedCents != null && growthPeriodCents != null
      ? incomeReceivedCents + growthPeriodCents
      : null;
  const step = (delta: number) => {
    haptics.selection();
    setShares((s) => Math.min(MAX_SHARES, Math.max(MIN_SHARES, s + delta)));
  };
  const pickMonths = (m: ProjectionMonths) => {
    if (m === months) return;
    haptics.selection();
    setMonths(m);
  };

  const metricLabel =
    "text-[0.625rem] font-medium uppercase leading-tight tracking-[0.07em] text-muted-foreground";
  const metricValue =
    "truncate whitespace-nowrap pt-1 text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum";

  void onBuy;
  return (
    <section className="min-w-0 space-y-2" data-testid="earn-position">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("earnTitle")}
      </h2>
      <BorderBeam size="md" colorVariant="colorful" strength={0.7}>
        <Block className="min-w-0 overflow-hidden rounded-[12px] p-5 shadow-sm ring-1 ring-border/60" data-testid="earn-card">
          {/* 1. Header — quiet, the numbers below carry the section */}
          <p className="break-words text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground">{t("earnHeadline")}</p>
          <p className="break-words pt-1 text-xs leading-relaxed text-muted-foreground/80">
            {t("earnSubtitle")}
          </p>

          {/* 2. Controls — stepper + investment, both quiet */}
          <div className="mt-4 flex min-h-[44px] items-center justify-between gap-3 border-t border-border/50 pt-4">
            <span className="min-w-0 truncate text-sm text-muted-foreground">{t("earnSharesLabel")}</span>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={shares <= MIN_SHARES}
                aria-label={t("calcDecreaseShares")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-foreground shadow-sm ring-1 ring-border/60 transition-all duration-200 ease-out hover:bg-surface-2/70 active:scale-[0.96] disabled:opacity-40"
                data-testid="earn-decrease"
              >
                <Minus size={16} strokeWidth={2} aria-hidden />
              </button>
              <span
                className="min-w-[2.5ch] text-center text-[1.125rem] font-bold tracking-tight tnum text-foreground"
                data-testid="earn-shares"
              >
                {shares}
              </span>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={shares >= MAX_SHARES}
                aria-label={t("calcIncreaseShares")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-foreground shadow-sm ring-1 ring-border/60 transition-all duration-200 ease-out hover:bg-surface-2/70 active:scale-[0.96]"
                data-testid="earn-increase"
              >
                <Plus size={16} strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-2">
            <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
              {t("earnInvestmentLabel")}
            </span>
            <span
              className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
              data-testid="earn-investment"
            >
              {v1 != null ? cur(investmentCents) : unavailableLabel("backend_absent")}
            </span>
          </div>

          {/* 3. Projection period — 1/3/6/9/12M segmented control */}
          <div className="mt-1 border-t border-border/50 pt-4">
            <p className="break-words text-[0.8125rem] font-medium text-muted-foreground">
              {t("earnPeriodLabel")}
            </p>
            <div
              className="mt-2 flex rounded-[10px] bg-surface-2 p-1"
              role="group"
              aria-label={t("earnPeriodLabel")}
              data-testid="earn-period"
            >
              {PROJECTION_MONTHS.map((m) => {
                const selected = m === months;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={selected}
                    aria-label={m === 1 ? t("earnPeriodMonthAria") : t("earnPeriodMonthsAria", { count: m })}
                    onClick={() => pickMonths(m)}
                    className={`h-11 flex-1 rounded-[8px] text-[0.8125rem] tnum transition-colors duration-200 ease-out active:scale-[0.98] ${
                      selected
                        ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border/60"
                        : "text-muted-foreground"
                    }`}
                    data-testid={`earn-period-${m}`}
                  >
                    {m}M
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Primary results — monthly income (cash) vs 12-mo growth (estimate) */}
          <div className="mt-4 grid grid-cols-2 divide-x divide-border/50 border-y border-border/50 py-4">
            <div className="min-w-0 pr-4">
              <p className={metricLabel}>{t("earnMonthlyLabel")}</p>
              <p className={`${metricValue} text-success`} data-testid="earn-monthly">
                {monthlyCents != null ? cur(monthlyCents) : unavailableLabel("backend_absent")}
              </p>
              <p className="break-words pt-1 text-[0.6875rem] leading-snug text-muted-foreground/70">{t("earnMonthlyCaption")}</p>
            </div>
            <div className="min-w-0 pl-4">
              <p className={metricLabel}>{t("earnGrowthLabel")}</p>
              <p className={`${metricValue} text-foreground`} data-testid="earn-growth">
                {growthTotalCents != null ? `+${cur(growthTotalCents)}` : unavailableLabel("backend_absent")}
              </p>
              <p className="break-words pt-1 text-[0.6875rem] leading-snug text-muted-foreground/70">{growthPctText != null ? `${t("earnGrowthCaption")} · ${growthPctText}` : t("earnGrowthCaption")}</p>
            </div>
          </div>

          {/* 5. Selected-period breakdown — income received + prorated growth */}
          <div
            className="mt-4 rounded-[10px] bg-surface-2/70 p-3.5 ring-1 ring-border/40"
            data-testid="earn-snapshot"
            aria-live="polite"
          >
            <p className={metricLabel}>
              {months === 1 ? t("earnAfterOne") : t("earnAfterTitle", { count: months })}
            </p>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-1">
              <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
                {t("earnSnapshotIncomeLabel")}
              </span>
              <span
                className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
                data-testid="earn-snapshot-income"
              >
                {incomeReceivedCents != null
                  ? cur(incomeReceivedCents)
                  : unavailableLabel("backend_absent")}
              </span>
            </div>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-1">
              <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
                {t("earnSnapshotGrowthLabel")}
              </span>
              <span
                className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
                data-testid="earn-snapshot-growth"
              >
                {growthPeriodCents != null
                  ? `+${cur(growthPeriodCents)}`
                  : unavailableLabel("backend_absent")}
              </span>
            </div>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-1">
              <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
                {t("earnSnapshotValueLabel")}
              </span>
              <span
                className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
                data-testid="earn-snapshot-value"
              >
                {shareValueCents != null
                  ? cur(shareValueCents)
                  : unavailableLabel("backend_absent")}
              </span>
            </div>
            <div className="mt-1 grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 border-t border-border/50 pt-2.5">
              <span className="min-w-0 truncate text-[0.8125rem] font-semibold text-foreground">
                {t("earnSnapshotTotalLabel")}
              </span>
              <span
                className="shrink-0 whitespace-nowrap text-[1.0625rem] tnum font-bold tracking-tight text-foreground"
                data-testid="earn-snapshot-total"
              >
                {totalBenefitCents != null
                  ? cur(totalBenefitCents)
                  : unavailableLabel("backend_absent")}
              </span>
            </div>
          </div>

          {/* 6. Disclaimer — kept, quiet, canonical wording */}
          <p className="break-words pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground/70">
            {t("earnFooter")}
          </p>
        </Block>
      </BorderBeam>
    </section>
  );
}
