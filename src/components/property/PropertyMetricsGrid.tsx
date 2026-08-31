// File responsibility: compact KPI area (REDESIGN-SPEC §6 / Phase 9 UI Mapping §5.2) —
// 2×2 key metrics grid with ownership-first wording. Primary shows the fixed offering
// price; secondary shows the market price (lib/property-price). Only available data —
// no invented metrics. The monthly figure is a rate-based projection and is labeled
// as such (Phase 9: projected values are never conflated with paid/actual).
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import type { Listing } from "@/types/property";
import { shareMonthlyYieldUsd, totalValueUsd } from "@/lib/property-yield";
import { Block } from "@/components/common/Block";

function MetricCell({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 p-3 min-h-[72px] ${className}`}>
      <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-[0.9375rem] font-semibold text-foreground tnum leading-tight">{value}</span>
    </div>
  );
}

export function PropertyMetricsGrid({
  listing,
  currentPriceUsd,
}: {
  listing: Listing;
  /** Single source of truth (lib/property-price) — equals sharePriceUsd on primary. */
  currentPriceUsd?: number;
}) {
  const t = useTranslations("property");
  const oneShareMonthly = shareMonthlyYieldUsd(listing);
  const pricePerShare = currentPriceUsd ?? listing.sharePriceUsd;

  return (
    <Block className="overflow-hidden" data-testid="metrics-grid">
      <div className="grid grid-cols-2">
        <MetricCell
          label={t("sharePrice")}
          value={usd(pricePerShare)}
          className="border-b border-r border-border"
        />
        <MetricCell label={t("metricProjectedIncome")} value={usd(oneShareMonthly)} className="border-b border-border" />
        <MetricCell label={t("totalPropertyValue")} value={usd(totalValueUsd(listing))} className="border-r border-border" />
        <MetricCell
          label={t("sharesSoldOf")}
          value={`${listing.sharesSold.toLocaleString()} / ${listing.totalShares.toLocaleString()}`}
        />
      </div>
    </Block>
  );
}
