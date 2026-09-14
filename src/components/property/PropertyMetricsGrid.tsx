// File responsibility: compact KPI area — the four decision metrics (Layer-1
// redesign, DEC-013 "glass" pass). Only numbers a buyer decides with: price,
// projected monthly, funded % (primary) or sold (secondary), projected per
// share / year. Visual language: a quiet glass card — translucent surface,
// hairline ring, soft top-light gradient — over the flat Telegram base; values
// get the weight (22px semibold tabular), labels stay whisper-quiet 10px.
// Pending figures render muted (never loud, never invented); total estate
// value lives in the hero; sold/remaining lives in the funding bar.
import { useTranslations } from "next-intl";
import { eur, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { Listing } from "@/types/property";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { cn } from "@/lib/utils";

function MetricCell({
  label,
  value,
  className = "",
  testId,
  muted = false,
}: {
  label: string;
  value: string;
  className?: string;
  testId?: string;
  /** Pending/unknown figures sit quieter than hard numbers. */
  muted?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-4 min-h-[76px] min-w-0", className)}>
      <span className="text-[0.625rem] font-medium uppercase tracking-[0.08em] text-muted-foreground leading-tight">
        {label}
      </span>
      <span
        className={cn(
          "truncate text-[1.25rem] font-semibold leading-none tnum",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
        data-testid={testId}
      >
        {value}
      </span>
    </div>
  );
}

export function PropertyMetricsGrid({
  listing,
  currentPriceUsd,
  bestAskUsd,
  v1,
  totalSharesOverride,
}: {
  listing: Listing;
  /** Single source of truth (lib/property-price) — equals sharePriceUsd on primary. */
  currentPriceUsd?: number;
  /** Live book ask when known — labels the price basis honestly (Slice 4). */
  bestAskUsd?: number | null;
  /**
   * Financial Model V1 evaluation (PROMPT 05 sole authority for the monthly
   * figure). Absent → honest pending state (never the legacy yield-rate math).
   */
  v1?: FinancialModelV1PropertyModel | null;
  /** V1 canonical total (Layer 1) — the funded % denominator on primary. */
  totalSharesOverride?: number | null;
}) {
  const t = useTranslations("property");
  // DEC-013 dedup: the KPI cells render the figures only — the primary-base
  // note and the pending-income reason were removed here (the reason still
  // lives on the Income tab where the user asks for the breakdown; the $100
  // base is the price figure itself).
  const monthly = v1?.perShare.monthlyCents ?? null;
  const perShare = v1?.perShare;
  const money = (cents: number) =>
    perShare?.currency === "EUR" ? eur(cents) : usd(cents);
  const monthlyText =
    monthly != null ? money(monthly) : unavailableLabel("backend_absent");
  const annualText =
    perShare?.annualCents != null
      ? money(perShare.annualCents)
      : unavailableLabel("backend_absent");
  const pricePerShare = currentPriceUsd ?? listing.sharePriceUsd;
  // Slice 4: the price label follows the price basis — the $100 primary offering,
  // a resale ask, or a last trade are never presented under one shared name.
  const isPrimary = listing.status === "funding";
  const askUsd = bestAskUsd ?? listing.bestAskUsd ?? null;
  const priceLabel = isPrimary
    ? t("sharePrice")
    : askUsd != null && pricePerShare === askUsd
      ? t("askPrice")
      : listing.lastTradeUsd != null && pricePerShare === listing.lastTradeUsd
        ? t("lastPrice")
        : t("sharePrice");
  // Funded % (primary): demo-ledger sold ÷ V1 canonical total — the only
  // honest sold source (PRODUCT-DECISION-LOCK §6).
  const totalForPct = totalSharesOverride ?? listing.totalShares;
  const fundedRatio = totalForPct > 0 ? listing.sharesSold / totalForPct : 0;

  return (
    <div
      className="overflow-hidden rounded-[14px] ring-1 ring-white/[0.06] bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-sm"
      data-testid="metrics-grid"
    >
      <div className="grid grid-cols-2">
        <MetricCell
          label={priceLabel}
          value={usd(pricePerShare)}
          className="border-b border-r border-white/[0.05]"
          testId="metrics-price"
        />
        <MetricCell
          label={t("metricProjectedIncome")}
          value={monthlyText}
          muted={monthly == null}
          className="border-b border-white/[0.05]"
          testId="metrics-monthly"
        />
        {isPrimary ? (
          <MetricCell
            label={t("metricFunded")}
            value={t("fundedCaptionShort", { pct: Math.round(fundedRatio * 100) })}
            className="border-r border-white/[0.05]"
            testId="metrics-funded"
          />
        ) : (
          <MetricCell
            label={t("metricSold")}
            value={listing.sharesSold.toLocaleString()}
            className="border-r border-white/[0.05]"
            testId="metrics-sold"
          />
        )}
        <MetricCell
          label={t("metricAnnual")}
          value={annualText}
          muted={perShare?.annualCents == null}
          testId="metrics-annual"
        />
      </div>
    </div>
  );
}
