"use client";
// File responsibility: Earn tab §1 — Your position (breathing revision
// 2026-09-14): the ONE strong section — minimum copy, maximum clarity. Two
// equal metrics (monthly income from the presented Base scenario; 12-month
// value growth as a RANGE from the locked D10 band), a compact inset
// 12-month snapshot, one tiny disclaimer line, and the Buy CTA. Current
// value = sharePrice × qty exactly.
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import {
  getPresentedMonthlyIncome,
  getPresentedPrimaryPrice,
} from "@/lib/economics/property-presentation";
import { ESTATE_GROWTH_ASSUMPTION } from "@/lib/economics/estates/estate-page-constants";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { BorderBeam } from "border-beam";
import { Block } from "@/components/common/Block";

const MIN_SHARES = 1;
const MAX_SHARES = 100;

export function YourPositionSection({
  v1,
  propertyId,
  onBuy,
}: {
  v1: FinancialModelV1PropertyModel | null;
  propertyId: string;
  /** Routes into the existing buy flow (Slice G/H untouched). */
  onBuy: () => void;
}) {
  const t = useTranslations("property");
  const [shares, setShares] = useState(MIN_SHARES);
  const monthly = getPresentedMonthlyIncome(propertyId);
  const currency = monthly.currency;
  const cur = (cents: number) => moneySmart(cents, currency);
  const priceCents = getPresentedPrimaryPrice();
  const investmentCents = shares * priceCents;
  // D10 assumed growth band — always a RANGE (3–5% p.a.), scaled by qty.
  const growthLowCents = Math.round((investmentCents * ESTATE_GROWTH_ASSUMPTION.minPctPerYear) / 100);
  const growthHighCents = Math.round((investmentCents * ESTATE_GROWTH_ASSUMPTION.maxPctPerYear) / 100);
  const monthlyCents = monthly.cents != null ? monthly.cents * shares : null;
  const receivedCents = monthlyCents != null ? monthlyCents * 12 : null;
  const step = (delta: number) =>
    setShares((s) => Math.min(MAX_SHARES, Math.max(MIN_SHARES, s + delta)));

  const metricLabel =
    "text-[0.625rem] font-medium uppercase leading-tight tracking-[0.07em] text-muted-foreground";
  const metricValue =
    "truncate whitespace-nowrap pt-1 text-[1.375rem] font-bold leading-none tracking-[-0.02em] tnum text-foreground";

  return (
    <section className="space-y-2" data-testid="earn-position">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("earnTitle")}
      </h2>
      <BorderBeam size="md" colorVariant="colorful" strength={0.7}>
        <Block className="rounded-[12px] p-5 shadow-sm ring-1 ring-border/60" data-testid="earn-card">
          <p className="text-[0.9375rem] font-semibold tracking-[-0.02em] text-foreground">{t("earnHeadline")}</p>
          <p className="pt-1 text-xs leading-relaxed text-muted-foreground/80">
            {t("earnSubtitle")}
          </p>

          {/* Controls */}
          <div className="flex min-h-[44px] items-center justify-between gap-3 pt-4">
            <span className="text-sm text-muted-foreground">{t("earnSharesLabel")}</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t("calcDecreaseShares")}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-foreground shadow-sm ring-1 ring-border/60 transition-all duration-200 ease-out hover:bg-surface-2/70 active:scale-[0.96]"
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

          {/* Two equal metrics — one caption line each, no walls of text */}
          <div className="mt-3 grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
            <div className="min-w-0">
              <p className={metricLabel}>{t("earnMonthlyLabel")}</p>
              <p className={metricValue} data-testid="earn-monthly">
                {monthlyCents != null ? cur(monthlyCents) : unavailableLabel("backend_absent")}
              </p>
              <p className="pt-1 text-[0.6875rem] leading-snug text-muted-foreground/70">{t("earnMonthlyCaption")}</p>
            </div>
            <div className="min-w-0">
              <p className={metricLabel}>{t("earnGrowthLabel")}</p>
              <p className={metricValue} data-testid="earn-growth">
                +{cur(growthLowCents)} – {cur(growthHighCents)}
              </p>
              <p className="pt-1 text-[0.6875rem] leading-snug text-muted-foreground/70">{t("earnGrowthCaption")}</p>
            </div>
          </div>

          {/* Compact inset 12-month snapshot — visually secondary to the metrics */}
          <div className="mt-4 rounded-[10px] bg-surface-2/70 p-3.5 ring-1 ring-border/40" data-testid="earn-snapshot">
            <p className={metricLabel}>{t("earnSnapshotTitle")}</p>
            <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-1">
              <span className="min-w-0 truncate text-[0.8125rem] text-muted-foreground">
                {t("earnSnapshotIncomeLabel")}
              </span>
              <span
                className="shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight text-foreground"
                data-testid="earn-snapshot-income"
              >
                {receivedCents != null
                  ? `${cur(receivedCents)} (≈)`
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
                {`${cur(investmentCents + growthLowCents)} – ${cur(investmentCents + growthHighCents)}`}
              </span>
            </div>
          </div>

          <p className="pt-3 text-[0.6875rem] leading-relaxed text-muted-foreground/70">
            {t("earnFooter")}
          </p>

          <button
            type="button"
            onClick={onBuy}
            className="mt-4 flex h-[44px] w-full items-center justify-center rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:bg-primary/90 active:scale-[0.98]"
            data-testid="earn-buy"
          >
            {t("ownershipV1Buy")}
          </button>
        </Block>
      </BorderBeam>
    </section>
  );
}
