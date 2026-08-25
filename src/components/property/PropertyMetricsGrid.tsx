// File responsibility: 2×2 key metrics grid (REDESIGN-SPEC §4.2).
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
  const oneShareMonthly = shareMonthlyYieldUsd(listing);
  const pricePerShare = currentPriceUsd ?? listing.sharePriceUsd;

  return (
    <Block className="overflow-hidden" data-testid="metrics-grid">
      <div className="grid grid-cols-2">
        <MetricCell label="Price per share" value={usd(pricePerShare)} className="border-b border-r border-border" />
        <MetricCell label="Monthly yield / share" value={usd(oneShareMonthly)} className="border-b border-border" />
        <MetricCell label="Total property value" value={usd(totalValueUsd(listing))} className="border-r border-border" />
        <MetricCell label="Shares sold" value={listing.sharesSold.toLocaleString()} />
      </div>
    </Block>
  );
}
