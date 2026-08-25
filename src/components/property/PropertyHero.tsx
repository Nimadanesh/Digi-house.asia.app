// File responsibility: hero section — status banner, title/location, yield headline,
// trust line, and the in-page primary CTA (REDESIGN-SPEC §4.1).
import { MapPin } from "lucide-react";
import { pct, usd } from "@/lib/format";
import type { Listing } from "@/types/property";
import { annualReturnRatio } from "@/lib/property-yield";
import { getCurrentSharePrice } from "@/lib/property-price";
import { PropertyStatusBanner } from "./PropertyStatusBanner";

export function PropertyHero({
  listing,
  bestAskUsd,
  onBuy,
}: {
  listing: Listing;
  /** Live ask for secondary listings (single price source flows through getCurrentSharePrice). */
  bestAskUsd?: number;
  onBuy: () => void;
}) {
  const apy = annualReturnRatio(listing);
  const isPrimary = listing.status === "funding";
  const monthsPaid = listing.rentalHistory.length;
  // Single source of truth — same value as Metrics / Calculator / Chart / Sticky CTA.
  const buyPriceUsd = getCurrentSharePrice(listing, { bestAskUsd });

  return (
    <div className="space-y-3" data-testid="property-hero">
      <PropertyStatusBanner listing={listing} />

      <h1 className="text-[1.375rem] font-bold leading-tight text-foreground">{listing.title}</h1>

      <p className="flex items-center gap-1 text-sm text-muted-foreground">
        <MapPin size={15} className="shrink-0" aria-hidden />
        <span className="truncate">{listing.location}</span>
      </p>

      <div className="pt-1">
        <p className="text-[2.5rem] font-bold leading-none tracking-tight text-success tnum" data-testid="hero-apy">
          {pct(apy)}
        </p>
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">Expected Annual Yield</p>
        {monthsPaid > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground tnum" data-testid="hero-trust-line">
            Based on current lease · {monthsPaid}{" "}
            {monthsPaid === 1 ? "month" : "months"} on-time payments
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={onBuy}
        disabled={(isPrimary && listing.sharesRemaining <= 0) || (!isPrimary && bestAskUsd == null)}
        className="flex h-[50px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
        data-testid="hero-cta"
      >
        {isPrimary ? (
          listing.sharesRemaining <= 0 ? (
            "Primary offering sold out"
          ) : (
            <>
              Buy Shares · <span className="tnum">{usd(buyPriceUsd)}</span>
            </>
          )
        ) : (
          <>
            Buy at <span className="tnum">{usd(buyPriceUsd)}</span>
          </>
        )}
      </button>
    </div>
  );
}
