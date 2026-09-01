"use client";
// File responsibility: Estates listing card (Phase 9 Slice 4 — redesign §6 / UI Mapping §4.5).
// Identity-first vertical card: premium image with a single quiet status badge, estate name +
// location/type, price per share (single source getCurrentSharePrice), projected income per
// share (or an honest "Data pending" chip — never 0), the ownership fraction one share
// represents, and availability only for primary offerings. No APY, no scarcity/flame cues, no
// per-card Buy — the whole card opens the estate detail. Flat block (no drop shadow).
import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Info, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usd } from "@/lib/format";
import { getCurrentSharePrice } from "@/lib/property-price";
import { projectedMonthlyIncomeUsd, hasIncomeData, listingStatusBadge, MARKETPLACE_DEMO_CLOCK_MS } from "@/lib/marketplace-filter";
import { ROUTES } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { FundingBar } from "./FundingBar";
import { FeeInfoButton } from "@/components/common/FeeInfoButton";

function PropertyCardInner({
  listing,
  variant = "list",
  holding,
  className,
  nowMs = 0,
  onNavigateHaptic,
  priority = false,
}: {
  listing: Listing;
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
        href={ROUTES.property(listing.id)}
        onClick={() => onNavigateHaptic?.()}
        className={cn(
          "block bg-card rounded-[12px] active:scale-[0.98] transition-transform duration-[120ms] ease-out",
          className,
        )}
      >
        <div className="flex items-center gap-3 p-4">
          <div className="relative size-12 rounded-[10px] bg-surface-2 shrink-0 overflow-hidden">
            {listing.images[0] ? (
              <Image
                src={listing.images[0]}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[0.9375rem] font-semibold text-foreground truncate">{listing.title}</h2>
            {holding ? (
              <>
                <p className="text-xs text-muted-foreground truncate tnum">
                  {holding.sharesOwned} / {listing.totalShares} {tCommon("shares")} · {usd(holding.currentValueUsd)}
                </p>
                <p className="text-xs text-warning tnum mt-0.5">
                  {tHome("pendingThisWeek", { amount: usd(holding.pendingWeekEarningsUsd) })}
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground truncate">{listing.location}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  const cover = listing.images[0] ?? "/images/properties/p1.png";
  const incomeAvailable = hasIncomeData(listing);
  // PD-07: on the resale market the price is the latest executed trade, not the
  // historical offering price. getCurrentSharePrice is the single source.
  const displayPrice = getCurrentSharePrice(listing);
  const secondary = listing.status === "resale" || listing.status === "funded";
  // Shared demo-tape clock: keeps the "New" badge and the "New" filter in agreement.
  const clock = nowMs > 0 ? nowMs : MARKETPLACE_DEMO_CLOCK_MS;
  const badge = listingStatusBadge(listing, clock);
  const showNewBadge = badge.kind === "new";

  return (
    <Link
      href={ROUTES.property(listing.id)}
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
          alt={listing.title}
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
        <span className="absolute bottom-2.5 end-2.5">
          <FeeInfoButton variant="icon" />
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h2 className="text-[0.9375rem] font-semibold leading-snug text-foreground">{listing.title}</h2>
          <p className="mt-1.5 flex items-center gap-1 text-sm leading-relaxed text-muted-foreground">
            <MapPin size={14} strokeWidth={1.75} className="shrink-0" aria-hidden />
            <span className="truncate">
              {listing.location}
              {listing.meta.propertyType ? <span> · {listing.meta.propertyType}</span> : null}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3" data-testid="card-metrics">
          <Metric
            label={secondary ? t("lastPrice") : t("pricePerShare")}
            value={usd(displayPrice)}
          />
          {incomeAvailable ? (
            <Metric label={t("projectedIncome")} value={usd(projectedMonthlyIncomeUsd(listing))} />
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
          {t("shareFraction", { total: listing.totalShares })}
        </p>

        {listing.status === "funding" ? (
          <div className="space-y-1.5">
            <FundingBar progress={listing.fundingProgressRatio} funded={listing.fundingProgressRatio >= 1} />
            <p
              className="text-xs leading-relaxed text-muted-foreground tnum pt-0.5"
              data-testid="card-availability"
            >
              {t("fundedCaption", {
                pct: Math.round(listing.fundingProgressRatio * 100),
                remaining: listing.sharesRemaining,
              })}
            </p>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export const PropertyCard = memo(PropertyCardInner);

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-[0.625rem] uppercase tracking-wide leading-tight text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-[0.8125rem] font-semibold tnum text-foreground">
        {value}
      </div>
    </div>
  );
}