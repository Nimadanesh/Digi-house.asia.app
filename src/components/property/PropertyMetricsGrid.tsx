// File responsibility: 2×2 key metrics grid (Fable §Metrics).
import { usd, weeklyRent, projectedYield, annualYieldRatio, pct } from "@/lib/format";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";

function MetricCell({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1 p-3 min-h-[72px] ${className}`}>
      <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-[0.9375rem] font-semibold text-foreground tnum leading-tight">{value}</span>
    </div>
  );
}

export function PropertyMetricsGrid({ listing }: { listing: Listing }) {
  const oneShareWeekly = projectedYield(weeklyRent(listing.annualRentUsd), 1, listing.totalShares);
  const totalValue = listing.sharePriceUsd * listing.totalShares;
  const annualApy = annualYieldRatio(listing.annualRentUsd, totalValue);

  return (
    <Block className="overflow-hidden" data-testid="metrics-grid">
      <div className="grid grid-cols-2">
        <MetricCell label="Price per share" value={usd(listing.sharePriceUsd)} className="border-b border-r border-border" />
        <MetricCell label="Weekly yield / share" value={usd(oneShareWeekly)} className="border-b border-border" />
        <MetricCell label="Annual yield" value={pct(annualApy)} className="border-r border-border" />
        <MetricCell label="Total property value" value={usd(totalValue)} />
      </div>
    </Block>
  );
}
