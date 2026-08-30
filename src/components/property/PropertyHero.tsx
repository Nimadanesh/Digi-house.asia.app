// File responsibility: property header (REDESIGN-SPEC §5) — status banner,
// title/location, expected yield, and the in-page primary CTA.
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("property");
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
        <p className="mt-1.5 text-sm font-medium text-muted-foreground">{t("expectedAnnualYield")}</p>
        {monthsPaid > 0 ? (
          <p className="mt-1 text-xs text-muted-foreground tnum" data-testid="hero-trust-line">
            {t("basedOnLease", {
              count: monthsPaid,
              unit: monthsPaid === 1 ? t("monthWord") : t("monthsWord"),
            })}
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
            t("offeringSoldOut")
          ) : (
            t("buySharesAt", { price: usd(buyPriceUsd) })
          )
        ) : (
          t("buyAt", { price: usd(buyPriceUsd) })
        )}
      </button>
    </div>
  );
}
