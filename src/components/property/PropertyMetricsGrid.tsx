// File responsibility: compact KPI area (REDESIGN-SPEC §6 / Phase 9 UI Mapping §5.2) —
// 2×2 key metrics grid with ownership-first wording. Primary shows the fixed offering
// price; secondary shows the market price (lib/property-price). Only available data —
// no invented metrics. The monthly figure is a rate-based projection and is labeled
// as such (Phase 9: projected values are never conflated with paid/actual).
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import type { Listing } from "@/types/property";
import { shareMonthlyYieldUsd, totalValueUsd } from "@/lib/property-yield";
import { formatValuationDisplay, type ValuationDisplay } from "@/lib/economics/estates/growth-potential";
import { Block } from "@/components/common/Block";

function MetricCell({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 p-3 min-h-[72px] min-w-0 ${className}`}>
      <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground leading-tight">{label}</span>
      <span className="truncate text-[0.9375rem] font-semibold text-foreground tnum leading-tight">{value}</span>
    </div>
  );
}

export function PropertyMetricsGrid({
  listing,
  currentPriceUsd,
  totalValueUsdOverride,
  totalValueDisplay,
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
   * Current Estimated Value for DISPLAY (PROMPT 03 §4–§5) — Grand 2 BDM
   * renders the approved $8M–$10M range. Preferred over the single override.
   */
  totalValueDisplay?: ValuationDisplay | null;
}) {
  const t = useTranslations("property");
  const oneShareMonthly = shareMonthlyYieldUsd(listing);
  const pricePerShare = currentPriceUsd ?? listing.sharePriceUsd;
  const totalValueText =
    totalValueDisplay != null
      ? formatValuationDisplay(totalValueDisplay)
      : usd(totalValueUsdOverride ?? totalValueUsd(listing));

  return (
    <Block className="overflow-hidden" data-testid="metrics-grid">
      <div className="grid grid-cols-2">
        <MetricCell
          label={t("sharePrice")}
          value={usd(pricePerShare)}
          className="border-b border-r border-border"
        />
        <MetricCell label={t("metricProjectedIncome")} value={usd(oneShareMonthly)} className="border-b border-border" />
        <MetricCell label={t("totalPropertyValue")} value={totalValueText} className="border-r border-border" />
        <MetricCell
          label={t("sharesSoldOf")}
          value={`${listing.sharesSold.toLocaleString()} / ${listing.totalShares.toLocaleString()}`}
        />
      </div>
    </Block>
  );
}
