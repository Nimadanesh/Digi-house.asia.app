"use client";
// File responsibility: Estates listing card (Slice F — canonical marketplace,
// Slice J — conversion polish: entry-price hero, explicit View affordance).
// Identity-first vertical card: premium image with a single quiet status badge,
// canonical estate name + location/type, then a calm 2×2 metric grid — share
// price (single-source current price, hero size), nightly rate (canonical display,
// semantics preserved), Estate Value (canonical ESTIMATED + ⓘ provenance),
// projected income per share (or honest "Data pending" — never 0) — then the
// ownership fraction and availability only for primary offerings. No APY, no
// scarcity cues, no per-card Buy — the whole card opens the estate detail with
// an explicit View footer. Flat block (no drop shadow).
// Data via MarketplaceEstate view model only.
import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Info, MapPin, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usd, usdCompact } from "@/lib/format";
import {
  formatGrowthPct,
  formatValuationDisplayCompact,
} from "@/lib/economics/estates/growth-potential";
import {
  projectedMonthlyIncomeUsd,
  hasIncomeData,
  listingStatusBadge,
  MARKETPLACE_DEMO_CLOCK_MS,
} from "@/lib/marketplace-filter";
import { ROUTES } from "@/lib/constants";
import type { MarketplaceEstate } from "@/lib/economics/marketplace-view-model";
import { FundingBar } from "./FundingBar";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

function PropertyCardInner({
  estate,
  variant = "list",
  holding,
  className,
  nowMs = 0,
  onNavigateHaptic,
  priority = false,
}: {
  estate: MarketplaceEstate;
  variant?: "list" | "mini";
  holding?: { sharesOwned: number; currentValueUsd: number; pendingWeekEarningsUsd: number };
  className?: string;
  /** Epoch ms for status badge age (inject in tests; 0 → shared demo-tape clock). */
  nowMs?: number;
  onNavigateHaptic?: () => void;
  /** LCP hint for the first marketplace card. */
  priority?: boolean;
}) {
  const t = useTranslations("estates");
  const tHome = useTranslations("home");
  const tCommon = useTranslations("common");
  const tProperty = useTranslations("property");

  if (variant === "mini") {
    return (
      <Link
        href={ROUTES.property(estate.id)}
        onClick={() => onNavigateHaptic?.()}
        className={cn(
          "block bg-card rounded-[12px] active:scale-[0.98] transition-transform duration-[120ms] ease-out",
          className,
        )}
      >
        <div className="flex items-center gap-3 p-4">
          <div className="relative size-12 rounded-[10px] bg-surface-2 shrink-0 overflow-hidden">
            {estate.images[0] ? (
              <Image
                src={estate.images[0]}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[0.9375rem] font-semibold text-foreground truncate">{estate.name}</h2>
            {holding ? (
              <>
                <p className="text-xs text-muted-foreground truncate tnum">
                  {holding.sharesOwned} / {estate.totalShares} {tCommon("shares")} · {usd(holding.currentValueUsd)}
                </p>
                <p className="text-xs text-warning tnum mt-0.5">
                  {tHome("pendingThisWeek", { amount: usd(holding.pendingWeekEarningsUsd) })}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground truncate">{estate.location}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  const cover = estate.images[0] ?? "/images/properties/p1.png";
  // Slice 2: income comes from the single presentation layer (V1, or pending).
  const incomeAvailable = hasIncomeData(estate);
  const secondary = estate.status === "resale" || estate.status === "funded";
  // Shared demo-tape clock: keeps the "New" badge and the "New" filter in agreement.
  const clock = nowMs > 0 ? nowMs : MARKETPLACE_DEMO_CLOCK_MS;
  const badge = listingStatusBadge(estate, clock);
  const showNewBadge = badge.kind === "new";

  return (
    <Link
      href={ROUTES.property(estate.id)}
      onClick={() => onNavigateHaptic?.()}
      className={cn(
        "block bg-card rounded-[12px] overflow-hidden active:scale-[0.98] transition-transform duration-[120ms] ease-out",
        className,
      )}
      data-testid="property-card"
    >
      <div className="relative aspect-[16/10] bg-surface-2">
        <Image
          src={cover}
          alt={estate.name}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 480px) 100vw, 480px"
        />
        {showNewBadge ? (
          <span
            className="absolute top-2.5 start-2.5 inline-flex items-center rounded-full bg-black/55 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-white"
            data-testid="card-status-badge"
          >
            {tCommon("new")}
          </span>
        ) : null}
      </div>

      <div className="p-4 pb-3 space-y-3">
        <div className="min-w-0">
          <h2 className="text-[0.9375rem] font-semibold leading-snug tracking-tight text-balance text-foreground">{estate.name}</h2>
          <p className="mt-1.5 flex items-center gap-1 text-sm leading-relaxed text-muted-foreground">
            <MapPin size={14} strokeWidth={1.75} className="shrink-0" aria-hidden />
            <span className="truncate">
              {estate.location}
              {estate.propertyType ? <span> · {estate.propertyType}</span> : null}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-3.5" data-testid="card-metrics">
          <Metric
            label={secondary ? t("lastPrice") : t("pricePerShare")}
            value={usd(estate.currentPriceUsd)}
            strong
          />
          {estate.nightlyDisplay ? (
            <Metric label={t("nightFrom")} value={estate.nightlyDisplay} />
          ) : (
            <Metric label={t("nightFrom")} value={t("incomePending")} />
          )}
          {estate.estateValue || estate.valuationDisplay ? (
            <div className="min-w-0" data-testid="card-estate-value">
              <div className="mb-1 text-[0.625rem] uppercase tracking-wide leading-tight text-muted-foreground">
                {t("estateValue")}
              </div>
              <div className="flex min-w-0 items-center gap-0.5">
                <span className="truncate text-[0.8125rem] font-semibold tnum text-foreground">
                  {estate.valuationDisplay
                    ? formatValuationDisplayCompact(estate.valuationDisplay)
                    : usdCompact(estate.estateValue!.value)}
                </span>
                <ProvenanceInfo provenance="estimated" className="!size-5" />
              </div>
            </div>
          ) : (
            <div className="min-w-0" data-testid="card-estate-value-pending">
              <div className="mb-1 text-[0.625rem] uppercase tracking-wide leading-tight text-muted-foreground">
                {t("estateValue")}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                <Info size={12} strokeWidth={1.75} aria-hidden />
                {t("incomePending")}
              </span>
            </div>
          )}
          {incomeAvailable ? (
            <Metric label={t("projectedIncome")} value={usd(projectedMonthlyIncomeUsd(estate))} />
          ) : (
            <div className="min-w-0" data-testid="card-income-pending">
              <div className="mb-1 text-[0.625rem] uppercase tracking-wide leading-tight text-muted-foreground">
                {t("projectedIncome")}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">
                <Info size={12} strokeWidth={1.75} aria-hidden />
                {t("incomePending")}
              </span>
            </div>
          )}
        </div>

        <p
          className="text-xs leading-relaxed text-muted-foreground tnum pt-0.5"
          data-testid="card-fraction"
        >
          {t("shareFraction", { total: estate.totalShares })}
        </p>

        {/* Growth Potential (PROMPT 03 §4–§6) — research-range upper, estimated.
            The label itself carries the estimated/research-derived provenance
            (no extra badge beside every card); never mixed with income. */}
        {estate.growthPotential ? (
          <p
            className="flex min-w-0 items-center justify-between gap-2 text-xs leading-relaxed tnum"
            data-testid="card-growth-potential"
          >
            <span className="flex min-w-0 items-center gap-1 truncate text-muted-foreground">
              <span className="min-w-0 truncate">{tProperty("growthPotentialTitle")}</span>
              <ProvenanceInfo provenance={estate.growthPotential.provenance} className="!size-5" />
            </span>
            <span dir="ltr" className="shrink-0 font-semibold text-foreground">
              {usdCompact(estate.growthPotential.potentialValue)}
              {formatGrowthPct(estate.growthPotential.potentialPct) != null
                ? ` · ${formatGrowthPct(estate.growthPotential.potentialPct)}`
                : null}
            </span>
          </p>
        ) : null}

        {estate.status === "funding" ? (
          <div className="space-y-1.5">
            <FundingBar progress={estate.fundingProgressRatio} funded={estate.fundingProgressRatio >= 1} />
            <p
              className="text-xs leading-relaxed text-muted-foreground tnum pt-0.5"
              data-testid="card-availability"
            >
              {t("fundedCaption", {
                pct: Math.round(estate.fundingProgressRatio * 100),
                remaining: estate.sharesRemaining,
              })}
            </p>
          </div>
        ) : null}

        <div
          className="flex min-h-[36px] items-center justify-between gap-2 border-t border-border pt-2.5"
          data-testid="card-view"
        >
          <span className="text-[0.8125rem] font-semibold text-primary">
            {t("viewEstate")}
          </span>
          <ChevronRight
            size={16}
            strokeWidth={2}
            className="shrink-0 text-primary rtl:rotate-180"
            aria-hidden
          />
        </div>
      </div>
    </Link>
  );
}

export const PropertyCard = memo(PropertyCardInner);

function Metric({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  /** Entry price hero — larger so the card answers "what can I buy" first. */
  strong?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[0.625rem] uppercase tracking-wide leading-tight text-muted-foreground">
        {label}
      </div>
      {/* Slice 7: numeric figures keep LTR order in RTL locales (bidi isolation;
          no-op in LTR). */}
      <div
        dir="ltr"
        className={
          strong
            ? "truncate text-[0.9375rem] font-bold tnum tracking-tight text-foreground"
            : "truncate text-[0.8125rem] font-semibold tnum text-foreground"
        }
      >
        {value}
      </div>
    </div>
  );
}
