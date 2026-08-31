// File responsibility: property header (REDESIGN-SPEC §5 / Phase 9 UI Mapping §5.2) —
// estate identity FIRST (status banner, name, place, verification state), then the
// ownership proposition (share price, ownership fraction, your position), then ONE
// dominant CTA. The yield figure is demoted out of the hero (no yield-first hierarchy)
// — fundamentals/metrics carry the projection labels instead.
import { MapPin, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { pct, usd } from "@/lib/format";
import type { Listing } from "@/types/property";
import type { EstateVerification } from "@/types/verification";
import { isVerified } from "@/types/verification";
import { getCurrentSharePrice } from "@/lib/property-price";
import { PropertyStatusBanner } from "./PropertyStatusBanner";

export function PropertyHero({
  listing,
  bestAskUsd,
  onBuy,
  ownedShares = 0,
  verification,
  onManageOwnership,
  onViewResale,
}: {
  listing: Listing;
  /** Live ask for secondary listings (single price source flows through getCurrentSharePrice). */
  bestAskUsd?: number;
  onBuy: () => void;
  /** Shares the user owns — flips the hero CTA to "Manage Ownership". */
  ownedShares?: number;
  /** Optional verification snapshot — badge renders ONLY when genuinely verified. */
  verification?: EstateVerification;
  /** Owner CTA → switches to the Ownership tab. */
  onManageOwnership?: () => void;
  /** Sold-out primary → opens + scrolls to the Resale market block. */
  onViewResale?: () => void;
}) {
  const t = useTranslations("property");
  const isPrimary = listing.status === "funding";
  const monthsPaid = listing.rentalHistory.length;
  // Single source of truth — same value as Metrics / Calculator / Chart / Sticky CTA.
  const buyPriceUsd = getCurrentSharePrice(listing, { bestAskUsd });
  const verified = isVerified(verification);
  const ownedPct = listing.totalShares > 0 ? ownedShares / listing.totalShares : 0;

  const soldOut = isPrimary && listing.sharesRemaining <= 0;
  const canBuy = isPrimary ? !soldOut : bestAskUsd != null;

  // CTA state machine (UI Mapping §5.2 hero row): owner → Manage; else primary →
  // Acquire Ownership; else secondary → Acquire Resale Ownership; sold-out primary →
  // View Resale Opportunities when a resale market exists, otherwise calm sold-out.
  let ctaLabel: string;
  let ctaDisabled = false;
  let onCta: () => void;
  if (ownedShares > 0 && onManageOwnership) {
    ctaLabel = t("heroManageOwnership");
    onCta = onManageOwnership;
  } else if (isPrimary && !soldOut) {
    ctaLabel = t("heroAcquireOwnership", { price: usd(buyPriceUsd) });
    onCta = onBuy;
  } else if (!isPrimary) {
    ctaLabel = t("heroAcquireResale");
    ctaDisabled = !canBuy;
    onCta = onBuy;
  } else if (onViewResale) {
    // Sold-out primary with a resale market available.
    ctaLabel = t("heroViewResale");
    onCta = onViewResale;
  } else {
    ctaLabel = t("offeringSoldOut");
    ctaDisabled = true;
    onCta = onBuy;
  }

  return (
    <div className="space-y-3" data-testid="property-hero">
      <PropertyStatusBanner listing={listing} />

      <h1 className="text-[1.375rem] font-bold leading-tight text-foreground">{listing.title}</h1>

      <div className="flex items-center gap-2">
        <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={15} className="shrink-0" aria-hidden />
          <span className="truncate">{listing.location}</span>
        </p>
        {verified ? (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold text-success"
            data-testid="hero-verified"
          >
            <Check size={13} strokeWidth={2.25} aria-hidden />
            {t("trustVerifiedAt", { date: verification!.lastVerifiedAt })}
          </span>
        ) : null}
      </div>

      {/* Ownership proposition — share price + fraction of the estate */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-0.5">
        <span className="text-[2.25rem] font-bold leading-none tracking-tight text-foreground tnum" data-testid="hero-price">
          {usd(buyPriceUsd)}
        </span>
        <span className="text-sm text-muted-foreground" data-testid="hero-fraction">
          {t("heroShareFraction", { total: listing.totalShares })}
        </span>
      </div>

      {ownedShares > 0 ? (
        <p className="text-sm font-medium text-foreground tnum" data-testid="hero-ownership">
          {t("heroYouOwn", {
            count: ownedShares,
            unit: ownedShares === 1 ? t("shareWord") : t("sharesWord"),
            pct: pct(ownedPct),
          })}
        </p>
      ) : null}

      {monthsPaid > 0 ? (
        <p className="text-xs text-muted-foreground tnum" data-testid="hero-trust-line">
          {t("basedOnLease", {
            count: monthsPaid,
            unit: monthsPaid === 1 ? t("monthWord") : t("monthsWord"),
          })}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCta}
        disabled={ctaDisabled}
        className="flex h-[50px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
        data-testid="hero-cta"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
