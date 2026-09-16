// File responsibility: the fixed 4-stat section (Estate Page Structure §3,
// Layer-1 glass pass preserved): Monthly Income · Proj. / Year · Avg. Nightly
// Rate · Est. Growth. Monthly and annual are the presented V1 BASE per-share
// figures (single presentation path — they equal the Base scenario card by the
// locked PO rule), ANR comes from the V1 input (never ADR), growth is the
// locked D10 assumed band (estimated). Pending figures render muted (never
// invented); price/funding live in the hero (L0) and never duplicated here.
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { Listing } from "@/types/property";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import {
  getPresentedAnnualIncome,
  getPresentedMonthlyIncome,
} from "@/lib/economics/property-presentation";
import { ESTATE_GROWTH_ASSUMPTION } from "@/lib/economics/estates/estate-page-constants";
import { v1AnrToCents } from "@/lib/economics/financial-model-v1";
import { cn } from "@/lib/utils";

function StatCell({
  label,
  value,
  className = "",
  testId,
  muted = false,
}: {
  label: string;
  value: string;
  className?: string;
  testId?: string;
  /** Pending/assumed figures sit quieter than hard numbers. */
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col justify-center gap-1.5 bg-card p-4 transition-colors duration-150 ease-out hover:bg-surface-2/50",
        className,
      )}
    >
      <span className="text-[0.625rem] font-medium uppercase leading-tight tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "truncate text-[1.375rem] font-bold leading-none tracking-[-0.01em] tnum",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
        data-testid={testId}
      >
        {value}
      </span>
    </div>
  );
}

export function PropertyMetricsGrid({
  listing,
  v1,
}: {
  listing: Listing;
  /**
   * Financial Model V1 evaluation (sole authority). Absent → every economic
   * cell renders the honest pending state (never the legacy yield-rate math).
   */
  v1?: FinancialModelV1PropertyModel | null;
}) {
  const t = useTranslations("property");
  const monthly = getPresentedMonthlyIncome(listing.id);
  const annual = getPresentedAnnualIncome(listing.id);
  const money = (cents: number) => moneySmart(cents, monthly.currency);
  const monthlyText =
    monthly.cents != null ? money(monthly.cents) : unavailableLabel("backend_absent");
  const annualText =
    annual.cents != null ? money(annual.cents) : unavailableLabel("backend_absent");
  const anrText =
    v1 != null ? moneySmart(v1AnrToCents(v1.anr.valueMajor), v1.anr.currency) : unavailableLabel("backend_absent");

  return (
    <div
      className="overflow-hidden rounded-[14px] bg-card shadow-sm ring-1 ring-border/50"
      data-testid="metrics-grid"
    >
      <div className="grid grid-cols-2">
        <StatCell
          label={t("metricMonthlyIncome")}
          value={monthlyText}
          muted={monthly.cents == null}
          className="border-b border-r border-border/50"
          testId="metrics-monthly"
        />
        <StatCell
          label={t("metricAnnual")}
          value={annualText}
          muted={annual.cents == null}
          className="border-b border-border/50"
          testId="metrics-annual"
        />
        <StatCell
          label={t("metricAvgNightlyRate")}
          value={anrText}
          muted={v1 == null}
          className="border-r border-border/50"
          testId="metrics-anr"
        />
        <StatCell
          label={t("metricEstGrowth")}
          // Compact band for the half-width cell (assumed growth, estimated —
          // the full locked wording + source render on the Ownership tab §6.2).
          value={`+${ESTATE_GROWTH_ASSUMPTION.minPctPerYear}–${ESTATE_GROWTH_ASSUMPTION.maxPctPerYear}%`}
          testId="metrics-growth"
        />
      </div>
    </div>
  );
}
