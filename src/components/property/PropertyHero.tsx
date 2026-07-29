// File responsibility: property name + location + APY badge (Fable §Hero).
import { pct, annualYieldRatio } from "@/lib/format";
import type { Listing } from "@/types/property";
import { StatusPill } from "@/components/common/StatusPill";

export function PropertyHero({ listing }: { listing: Listing }) {
  const totalValue = listing.sharePriceUsd * listing.totalShares;
  const apy = annualYieldRatio(listing.annualRentUsd, totalValue);
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[1.0625rem] font-semibold leading-snug text-foreground">{listing.title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{listing.location}</p>
        </div>
        <span
          className="shrink-0 rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success tnum"
          data-testid="apy-badge"
        >
          {pct(apy)} APY
        </span>
      </div>
      {listing.status === "funding" ? (
        <StatusPill label="Open for funding" variant="warning" />
      ) : listing.status === "funded" ? (
        <StatusPill label="Fully funded" variant="success" />
      ) : (
        <StatusPill label="Resale" variant="warning" />
      )}
    </div>
  );
}
