// File responsibility: property header (REDESIGN-SPEC §5 / Phase 9 UI Mapping §5.2,
// Layer-1 redesign) — estate identity first (with an owner badge when the user
// holds shares), then the PRICE BLOCK as the visual dominant (price + fraction +
// funding-scarcity bar + estate-value row with its money-chain modal), then ONE
// dominant priced CTA. Basis words live on the metrics/resale surfaces — the hero
// repeats nothing (DEC-013 dedup).
import { useId, useState } from "react";
import { MapPin, Check, BadgeCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { pct, usd, usdCompact } from "@/lib/format";
import type { Listing } from "@/types/property";
import type { EstateVerification } from "@/types/verification";
import { isVerified } from "@/types/verification";
import type { Provenance } from "@/types/estate";
import type { EstateShareMarketState } from "@/types/estate-share";
import { getCurrentSharePrice } from "@/lib/property-price";
import {
  formatValuationDisplayShort,
  type ValuationDisplay,
} from "@/lib/economics/estates/growth-potential";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";
import { Sheet } from "@/components/common/Sheet";
import { haptics } from "@/lib/telegram/haptics";

export function PropertyHero({
  listing,
  bestAskUsd,
  onBuy,
  ownedShares = 0,
  verification,
  onManageOwnership,
  onViewResale,
  estateValueUsd,
  estateValueProvenance,
  estateValueDisplay,
  market,
  canonicalName,
  canonicalLocation,
  totalSharesOverride,
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
  /**
   * Canonical estate value (minor units) with provenance — Slice E contract §6A.
   * Shown ONLY when provided (canonical model); unknown stays hidden, never a
   * legacy mock figure presented as canonical.
   */
  estateValueUsd?: number | null;
  estateValueProvenance?: Provenance;
  /**
   * Current Estimated Value for DISPLAY (PROMPT 05): Grand 2 BDM renders the
   * approved $8M single value (V1 canonical). Preferred over the single
   * `estateValueUsd` when provided; both null → the row stays hidden (unknown,
   * never a legacy figure).
   */
  estateValueDisplay?: ValuationDisplay | null;
  /**
   * ShareModel market state (Slice E contract §9) — drives the CTA when provided.
   * Absent → the legacy status-based derivation (identical outcomes; kept for
   * backward compatibility with existing callers/tests).
   */
  market?: EstateShareMarketState;
  /**
   * Canonical Estate24 identity (PROMPT 03) — preferred over the legacy
   * fixture title/location whenever the view-model provides it. Absent →
   * listing identity (unknown ids only; never for the 24 canonical estates).
   */
  canonicalName?: string | null;
  canonicalLocation?: string | null;
  /**
   * V1 canonical total shares (PROMPT 05: valuation ÷ $100, e.g. 80,000 for
   * Grand). Preferred over the listing supply count for the ownership
   * fraction; absent → listing total (unknown ids only).
   */
  totalSharesOverride?: number | null;
}) {
  const t = useTranslations("property");
  const isPrimary = listing.status === "funding";
  // PROMPT 03 canonical identity — the Estate24 record is authoritative for
  // user-visible name/location; the fixture fallback serves unknown ids only.
  const displayName = canonicalName ?? listing.title;
  const displayLocation = canonicalLocation ?? listing.location;
  // PROMPT 05 fractionalization — the V1 canonical total (80,000 for Grand)
  // drives the ownership fraction; the trading supply count never does.
  const fractionTotal = totalSharesOverride ?? listing.totalShares;
  // Single source of truth — same value as Metrics / Calculator / Chart / Sticky CTA.
  const buyPriceUsd = getCurrentSharePrice(listing, { bestAskUsd });
  const verified = isVerified(verification);
  const ownedPct = fractionTotal > 0 ? ownedShares / fractionTotal : 0;
  // DEC-013: the estate-value row opens the money-chain modal (on-demand
  // explanation, not a repeated paragraph).
  const [valueOpen, setValueOpen] = useState(false);
  const valueTitleId = useId();

  const soldOut = isPrimary && listing.sharesRemaining <= 0;
  // Slice E §9: the CTA follows the ShareModel market state when provided; the
  // status-based derivation is outcome-identical for all reachable states (kept
  // for callers without a view-model). primaryAvailable ⟺ supply exists.
  // Sold-out primary always routes to the resale block (never a dead buy entry —
  // the primary buy entry rejects zero supply). A live ask also enables resale
  // acquisition (legacy price signal; the engine sees the same book levels).
  const primaryOpen = market
    ? market === "primaryAvailable" || market === "primaryNearlySoldOut"
    : isPrimary && !soldOut;
  const canBuySecondary = market
    ? market === "secondaryAvailable" || bestAskUsd != null
    : bestAskUsd != null;

  // CTA state machine (UI Mapping §5.2 hero row): owner → Manage; else primary →
  // Buy; else secondary → Buy resale (priced); sold-out primary → View Resale
  // Opportunities when a resale market exists, otherwise the honest all-sold line.
  let ctaLabel: string;
  let ctaDisabled = false;
  let onCta: () => void;
  if (ownedShares > 0 && onManageOwnership) {
    ctaLabel = t("heroManageOwnership");
    onCta = onManageOwnership;
  } else if (primaryOpen) {
    ctaLabel = t("heroAcquireOwnership", { price: usd(buyPriceUsd) });
    onCta = onBuy;
  } else if (!isPrimary) {
    ctaLabel = t("heroAcquireResale", { price: usd(buyPriceUsd) });
    ctaDisabled = !canBuySecondary;
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

  // Estate value row (DEC-013): compact short form — "$8M" / "$8–10M" — one
  // quiet figure with provenance; the sentence copy is gone (the price block
  // already carries both numbers). Unknown → row stays hidden.
  const valueText =
    estateValueDisplay != null
      ? formatValuationDisplayShort(estateValueDisplay)
      : estateValueUsd != null
        ? usdCompact(estateValueUsd)
        : null;
  const valueProvenance =
    estateValueDisplay?.provenance ?? estateValueProvenance ?? null;

  // Funding-scarcity module (Layer 1): the demo-ledger progress is the ONLY
  // honest urgency signal — bar + real remaining count, never invented pace.
  const fundingPct = fractionTotal > 0 ? listing.sharesSold / fractionTotal : 0;
  const fundingRemaining = fractionTotal - listing.sharesSold;

  return (
    <div className="space-y-3" data-testid="property-hero">
      {/* Estate name — restrained single-line treatment (never the visual dominant;
          the share price below carries the hero). Canonical name is authoritative
          and must never be clipped, so wrapping stays allowed for narrow screens.
          DEC-013: an at-a-glance ownership badge rides beside the name when the
          user holds shares of THIS estate. */}
      <div className="flex items-start gap-2">
        <h1 className="min-w-0 text-[1.0625rem] font-medium leading-snug tracking-tight text-balance text-foreground">{displayName}</h1>
        {ownedShares > 0 ? (
          <span
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-xs font-semibold text-success"
            data-testid="hero-owner-badge"
            aria-label={t("heroOwnerBadge")}
          >
            <BadgeCheck size={13} strokeWidth={2.25} aria-hidden />
            {t("heroOwnerBadge")}
          </span>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <p className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={15} className="shrink-0" aria-hidden />
          <span className="truncate">{displayLocation}</span>
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

      {/* Price block — the heart of the page. Price and fraction share one
          baseline; the scarcity bar breathes below it (extra top gap, DEC-013
          spacing feedback). No basis caption anywhere: the metrics label names
          the basis and the hero repeats nothing. */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-[2rem] font-bold leading-none tracking-tight text-foreground tnum break-words" data-testid="hero-price">
            {usd(buyPriceUsd)}
          </span>
          <span className="text-[0.8125rem] text-muted-foreground" data-testid="hero-fraction">
            {t("heroShareFraction", { total: fractionTotal.toLocaleString() })}
          </span>
        </div>

        {/* Funding-scarcity bar (primary only): replaces the old status banner.
            Real demo-ledger facts under the global DEMO disclosure — the bar is
            the pre-attentive scarcity signal, the count is the readable one. */}
        {isPrimary && !soldOut ? (
          <div
            className="rounded-[10px] bg-warning/12 px-3 py-2.5"
            data-testid="funding-bar"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[0.8125rem] font-semibold text-warning tnum" data-testid="funding-bar-pct">
                {t("fundedCaptionShort", { pct: Math.round(fundingPct * 100) })}
              </span>
              <span className="text-xs text-muted-foreground tnum" data-testid="funding-bar-left">
                {t("fundingBarLeft", {
                  count: Math.max(0, fundingRemaining).toLocaleString(),
                  total: fractionTotal.toLocaleString(),
                })}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-warning/20">
              <div
                className="h-full rounded-full bg-warning"
                style={{ width: `${Math.min(100, Math.max(0, fundingPct * 100))}%` }}
              />
            </div>
          </div>
        ) : null}
        {isPrimary && soldOut ? (
          <div
            className="rounded-[10px] bg-warning/12 px-3 py-2.5 text-[0.8125rem] font-semibold leading-relaxed text-warning"
            data-testid="funding-bar-sold-out"
          >
            {t("offeringAllSold", { total: fractionTotal.toLocaleString() })}
          </div>
        ) : null}
      </div>

      {/* Estate value row (DEC-013 dedup): a single quiet figure with the
          provenance ⓘ — no "own a piece / from $X" sentence (the price block
          already says both). Tapping it opens the money-chain modal: the
          "how does it earn" explanation lives on demand, not as a third
          repeated paragraph. */}
      {valueText != null ? (
        <>
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setValueOpen(true);
            }}
            className="flex w-fit items-center gap-1.5 text-sm tnum text-muted-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98]"
            data-testid="hero-estate-value"
          >
            {t("estateValue")}:{" "}
            <span className="font-semibold text-foreground">{valueText}</span>
            {valueProvenance ? <ProvenanceInfo provenance={valueProvenance} /> : null}
          </button>
          <Sheet open={valueOpen} onClose={() => setValueOpen(false)} labelledBy={valueTitleId}>
            <div className="space-y-2 pb-2" data-testid="hero-money-chain-sheet">
              <h2 id={valueTitleId} className="text-[0.9375rem] font-semibold text-foreground">
                {t("moneyChainTitle")}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("heroMoneyChain")}</p>
            </div>
          </Sheet>
        </>
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

      {/* Post-CTA stack (DEC-013 alignment feedback): fee note and the owner's
          position line share one centered block — same axis, same rhythm, no
          left-vs-center fight. */}
      <div className="space-y-1 text-center" data-testid="hero-post-cta">
        {/* Fee transparency under the action — no surprises at the last
            conversion step; reuses the established withdrawal-terms vocabulary. */}
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="hero-fee-note">
          {t("heroFeeNote")}
        </p>
        {ownedShares > 0 ? (
          <p className="text-xs font-medium leading-relaxed text-foreground tnum" data-testid="hero-ownership">
            {t("heroYouOwn", {
              count: ownedShares,
              unit: ownedShares === 1 ? t("shareWord") : t("sharesWord"),
              pct: pct(ownedPct),
            })}
          </p>
        ) : null}
      </div>
    </div>
  );
}
