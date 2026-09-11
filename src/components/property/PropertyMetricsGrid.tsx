// File responsibility: compact KPI area — 2×2 key metrics grid with
// ownership-first wording. Primary shows the fixed offering price; secondary
// shows the market price (lib/property-price). Monthly income is the V1
// PROJECTED per-share monthly (never the legacy yield-rate figure, never
// presented as paid); UNKNOWN renders the honest pending state. Only available
// data — no invented metrics.
import { useTranslations } from "next-intl";
import { eur, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { Listing } from "@/types/property";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { totalValueUsd } from "@/lib/property-yield";
import {
  getPresentedMonthlyIncome,
  presentedIncomeUnknownCaption,
} from "@/lib/economics/property-presentation";
import { formatValuationDisplayShort, type ValuationDisplay } from "@/lib/economics/estates/growth-potential";
import { Block } from "@/components/common/Block";

function MetricCell({
  label,
  value,
  className = "",
  hint,
  hintTestId,
}: {
  label: string;
  value: string;
  className?: string;
  /** Slice 3: short human-readable reason under a pending value (layout-safe caption). */
  hint?: string;
  hintTestId?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 p-3 min-h-[72px] min-w-0 ${className}`}>
      <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground leading-tight">{label}</span>
      <span className="truncate text-[0.9375rem] font-semibold text-foreground tnum leading-tight">{value}</span>
      {hint != null ? (
        <span className="text-[0.6875rem] leading-tight text-muted-foreground" data-testid={hintTestId}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function PropertyMetricsGrid({
  listing,
  currentPriceUsd,
  totalValueUsdOverride,
  totalValueDisplay,
  v1,
}: {
  listing: Listing;
  /** Single source of truth (lib/property-price) — equals sharePriceUsd on primary. */
  currentPriceUsd?: number;
  /**
   * Canonical total estate value (minor units) — Slice E QA: preferred over the
   * legacy mock figure when the canonical model provides one (Grand 2 BDM).
   * Null/undefined → legacy display (Slice I owns that reconciliation).
   */
  totalValueUsdOverride?: number | null;
  /**
   * Current Estimated Value for DISPLAY (PROMPT 05) — Grand 2 BDM renders the
   * approved $8M single value. Preferred over the single override.
   */
  totalValueDisplay?: ValuationDisplay | null;
  /**
   * Financial Model V1 evaluation (PROMPT 05 sole authority for the monthly
   * figure). Absent → honest pending state (never the legacy yield-rate math).
   */
  v1?: FinancialModelV1PropertyModel | null;
}) {
  const t = useTranslations("property");
  const monthly = v1?.perShare.monthlyCents ?? null;
  // Slice 3: a pending monthly figure always carries its human-readable reason
  // (single presentation layer — same classification as cards/calculator/buy).
  const incomeReason = presentedIncomeUnknownCaption(
    getPresentedMonthlyIncome(listing.id).unknownKind,
  );
  const monthlyCurrency = v1?.perShare.currency ?? "USD";
  const monthlyText =
    monthly != null
      ? monthlyCurrency === "EUR"
        ? eur(monthly)
        : usd(monthly)
      : unavailableLabel("backend_absent");
  const pricePerShare = currentPriceUsd ?? listing.sharePriceUsd;
  const totalValueText =
    totalValueDisplay != null
      ? formatValuationDisplayShort(totalValueDisplay)
      : usd(totalValueUsdOverride ?? totalValueUsd(listing));

  return (
    <Block className="overflow-hidden" data-testid="metrics-grid">
      <div className="grid grid-cols-2">
        <MetricCell
          label={t("sharePrice")}
          value={usd(pricePerShare)}
          className="border-b border-r border-border"
        />
        <MetricCell
          label={t("metricProjectedIncome")}
          value={monthlyText}
          className="border-b border-border"
          hint={incomeReason ?? undefined}
          hintTestId={incomeReason != null ? "metrics-income-reason" : undefined}
        />
        <MetricCell label={t("totalPropertyValue")} value={totalValueText} className="border-r border-border" />
        <MetricCell
          label={t("sharesSoldOf")}
          value={`${listing.sharesSold.toLocaleString()} / ${listing.totalShares.toLocaleString()}`}
        />
      </div>
    </Block>
  );
}
