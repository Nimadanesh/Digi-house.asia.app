"use client";
// File responsibility: Estates listing card (marketplace villa card) — one photo,
// title, two loud numbers (price + projected income), quiet meta whispers.
// Phase is an icon-only badge (Plus = primary offering, ArrowLeftRight = secondary
// market); no stage words anywhere visible. Whole card opens the estate detail.
// Data via MarketplaceEstate view model only; price via its currentPriceUsd
// (funding → offer, secondary → bestAsk ?? lastTrade ?? offer).
import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeftRight, Info, MapPin, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usd, usdCompact } from "@/lib/format";
import { formatValuationDisplayCompact } from "@/lib/economics/estates/growth-potential";
import {
  projectedMonthlyIncomeUsd,
  hasIncomeData,
  listingStatusBadge,
  MARKETPLACE_DEMO_CLOCK_MS,
} from "@/lib/marketplace-filter";
import { ROUTES } from "@/lib/constants";
import type { MarketplaceEstate } from "@/lib/economics/marketplace-view-model";
import { FundingBar } from "./FundingBar";

/** Display-only single place token: first segment before comma/·/en-dash. */
function localityOf(location: string): string {
  const [first] = location.split(/[,·–]/);
  return (first ?? location).trim();
}

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
  // Phase split mirrors the price helper exactly (funding → offer price;
  // funded/resale → bestAsk ?? lastTrade ?? offer), so icon and price agree.
  const secondary = estate.status === "resale" || estate.status === "funded";
  // Shared demo-tape clock: keeps the "New" badge and the "New" filter in agreement.
  const clock = nowMs > 0 ? nowMs : MARKETPLACE_DEMO_CLOCK_MS;
  const badge = listingStatusBadge(estate, clock);
  const showNewBadge = badge.kind === "new";
  const estateValueText = estate.valuationDisplay
    ? formatValuationDisplayCompact(estate.valuationDisplay)
    : estate.estateValue
      ? usdCompact(estate.estateValue.value)
      : null;

  return (
    <Link
      href={ROUTES.property(estate.id)}
      onClick={() => onNavigateHaptic?.()}
      className={cn(
        "block bg-card rounded-[16px] overflow-hidden active:scale-[0.98] transition-transform duration-[120ms] ease-out",
        className,
      )}
      data-testid="property-card"
      data-phase={secondary ? "secondary" : "primary"}
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
        <span
          data-testid="card-phase"
          aria-label={secondary ? "Secondary market" : "Primary offering"}
          className={cn(
            "absolute left-2 top-2 flex size-6 items-center justify-center rounded-full",
            secondary ? "bg-[rgba(255,255,255,0.16)]" : "bg-[#229ED9]",
          )}
        >
          {secondary ? (
            <ArrowLeftRight size={14} strokeWidth={2} aria-hidden className="text-white" />
          ) : (
            <Plus size={14} strokeWidth={2} aria-hidden className="text-white" />
          )}
        </span>
        {showNewBadge ? (
          <span
            className="absolute right-2 top-2 inline-flex items-center rounded-full bg-black/55 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-white"
            data-testid="card-status-badge"
          >
            {tCommon("new")}
          </span>
        ) : null}
      </div>

      <div className="px-3.5 pb-3.5 pt-3">
        <div className="min-w-0 space-y-2">
          <h2 className="truncate text-[15px] font-semibold leading-snug text-white">{estate.name}</h2>
          <p
            className="flex items-center gap-1 text-xs leading-relaxed text-[rgba(255,255,255,0.50)]"
            data-testid="card-location"
          >
            <MapPin size={12} strokeWidth={1.75} className="shrink-0" aria-hidden />
            <span className="truncate">
              {localityOf(estate.location)}
              {estate.propertyType ? <span> · {estate.propertyType}</span> : null}
            </span>
          </p>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] leading-tight text-[rgba(255,255,255,0.40)]">
              {secondary ? t("lastPrice") : t("pricePerShare")}
            </div>
            <div
              dir="ltr"
              className="mt-0.5 truncate text-[18px] font-semibold tnum text-white"
              data-testid="card-price"
            >
              {usd(estate.currentPriceUsd)}
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-[0.08em] leading-tight text-[rgba(255,255,255,0.40)]">
              {t("projectedIncome")}
            </div>
            {incomeAvailable ? (
              <div
                dir="ltr"
                className="mt-0.5 truncate text-[18px] font-semibold tnum text-white"
                data-testid="card-income"
              >
                {usd(projectedMonthlyIncomeUsd(estate))}
              </div>
            ) : (
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground"
                data-testid="card-income-pending"
              >
                <Info size={12} strokeWidth={1.75} aria-hidden />
                {t("incomePending")}
              </span>
            )}
          </div>
        </div>

        <p
          className="mt-2 truncate text-[0.8125rem] leading-relaxed text-[rgba(255,255,255,0.45)] tnum"
          data-testid="card-meta"
        >
          {/* Nightly range keeps LTR order in RTL locales (bidi isolation). */}
          <span dir="ltr">{estate.nightlyDisplay ?? t("incomePending")}</span>
          {" · "}
          {estateValueText ?? t("incomePending")}
        </p>

        <p
          className="mt-2 truncate text-[11px] leading-relaxed text-[rgba(255,255,255,0.35)] tnum"
          data-testid="card-fraction"
        >
          {t("shareFraction", { total: estate.totalShares.toLocaleString() })}
        </p>

        {estate.status === "funding" ? (
          <div className="mt-2">
            <FundingBar
              progress={estate.fundingProgressRatio}
              funded={estate.fundingProgressRatio >= 1}
              className="h-[3px]"
            />
            <p
              className="mt-1 text-[11px] leading-relaxed text-[rgba(255,255,255,0.45)] tnum"
              data-testid="card-availability"
            >
              {t("fundedCaption", {
                pct: Math.round(estate.fundingProgressRatio * 100),
                remaining: estate.sharesRemaining.toLocaleString(),
              })}
            </p>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export const PropertyCard = memo(PropertyCardInner);
