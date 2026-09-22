"use client";
// File responsibility: portfolio holding card — property, shares, value, lock/earning state, NFT receipt.
// Display-only redesign; figures unchanged from the Holding contract (monthly estimate = weekly ×52/12,
// the presentation conversion documented in FRACTIONALLUXE-PROGRAM A4).
import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Gift, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { usd, pct } from "@/lib/format";
import { holdingPnl } from "@/lib/portfolio-math";
import { ROUTES } from "@/lib/constants";
import { haptics } from "@/lib/telegram/haptics";
import type { Holding } from "@/types/position";
import type { NftStatus } from "@/types/nft";
import { cn } from "@/lib/utils";

export const monthlyFromWeeklyUsd = (weeklyUsdCents: number): number =>
  Math.round((weeklyUsdCents * 52) / 12);

function HoldingCardInner({
  holding,
  title,
  location,
  image,
  onDetails,
  lockedShares = 0,
  nftStatus = null,
}: {
  holding: Holding;
  title: string;
  location: string;
  image?: string;
  /** Opens the holding detail sheet (preserves existing detail rows). */
  onDetails: () => void;
  /** Shares of this holding currently locked for yield (§0.4). */
  lockedShares?: number;
  /** Collectible-NFT receipt status (display-only — the DB is the ownership record). */
  nftStatus?: NftStatus | null;
}) {
  const t = useTranslations("portfolio");
  const tCommon = useTranslations("common");
  const { unrealizedUsd, unrealizedRatio } = holdingPnl(holding);
  const up = unrealizedUsd >= 0;
  const sign = up ? "+" : "−";
  const freeShares = Math.max(0, holding.sharesOwned - lockedShares);
  const cover = image || "/images/properties/p1.png";
  const estateHref = ROUTES.property(holding.propertyId);
  const totalShares = Math.max(0, holding.sharesOwned);
  const earningRatio = totalShares > 0 ? lockedShares / totalShares : 0;

  const nftLabel = nftStatus
    ? {
        pending: t("nftStatusPending"),
        minting: t("nftStatusMinting"),
        minted: t("nftStatusMinted"),
        transferring: t("nftStatusTransferring"),
        delivered: t("nftStatusDelivered"),
        failed: t("nftStatusFailed"),
      }[nftStatus]
    : null;

  return (
    <article
      className="rounded-[12px] bg-card p-5"
      data-testid={"holding-card-" + holding.propertyId}
    >
      <Link
        href={estateHref}
        onClick={() => haptics.selection()}
        className="flex items-start gap-3.5 text-left active:opacity-80 transition-opacity duration-[120ms] ease-out"
        aria-label={title}
      >
        <div className="relative size-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
          <Image src={cover} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">{title}</p>
          <p className="truncate text-xs leading-relaxed text-muted-foreground">{location}</p>
        </div>
        <div className="ms-2 shrink-0 space-y-1 text-end">
          <p
            className={cn("text-[0.9375rem] font-semibold tnum", up ? "text-success" : "text-danger")}
            data-testid="holding-pnl"
          >
            {sign}
            {pct(Math.abs(unrealizedRatio))}
          </p>
          <p className="text-xs text-muted-foreground tnum" data-testid="holding-value">
            {usd(holding.currentValueUsd)}
          </p>
        </div>
      </Link>

      <div className="mt-4 space-y-2.5 border-t border-border pt-4">
        <p className="text-[0.8125rem] font-medium text-foreground tnum" data-testid="holding-shares-breakdown">
          {totalShares} {tCommon("shares")}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {lockedShares > 0 ? (
            <span
              className="inline-flex items-center rounded-full bg-primary/12 px-2.5 py-1 text-[0.6875rem] font-semibold text-primary tnum"
              data-testid="holding-locked-pill"
            >
              {t("earningPill", { count: lockedShares })}
            </span>
          ) : null}
          {freeShares > 0 ? (
            <span
              className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[0.6875rem] font-medium text-muted-foreground tnum"
              data-testid="holding-idle-pill"
            >
              {t("idlePill", { count: freeShares })}
            </span>
          ) : null}
          {nftStatus && nftLabel ? (
            <span className="ms-auto inline-flex min-w-0 items-center gap-1" data-testid="holding-nft-status">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  nftStatus === "delivered"
                    ? "bg-success"
                    : nftStatus === "failed"
                      ? "bg-danger"
                      : nftStatus === "pending"
                        ? "bg-muted-foreground/50"
                        : "bg-primary",
                )}
                aria-hidden
              />
              <span className="truncate text-[0.6875rem] font-medium leading-relaxed text-muted-foreground">
                {t("nftCollectible")} · {nftLabel}
              </span>
            </span>
          ) : null}
        </div>
        {totalShares > 0 && (lockedShares > 0 || freeShares > 0) ? (
          <div
            className="flex h-1 w-full overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(earningRatio * 100)}
            aria-label={t("lockedShares")}
            data-testid="holding-earning-bar"
          >
            <div className="h-full bg-primary" style={{ width: `${earningRatio * 100}%` }} />
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{t("projectedMonthlyShort")}</span>
        <span className="font-medium text-success tnum" data-testid="holding-monthly">
          {t("estMonthly", { amount: usd(monthlyFromWeeklyUsd(holding.pendingWeekEarningsUsd)) })}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Link
          href={estateHref}
          onClick={() => haptics.selection()}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-surface-2 px-4 text-[0.875rem] font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid={"gift-shares-" + holding.propertyId}
          aria-label={t("giftShares")}
        >
          <Gift size={17} strokeWidth={1.75} aria-hidden className="shrink-0" />
          {t("giftShares")}
        </Link>
        <button
          type="button"
          onClick={() => {
            haptics.selection();
            onDetails();
          }}
          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted-foreground active:scale-[0.95] transition-transform duration-[120ms] ease-out"
          data-testid={"holding-details-" + holding.propertyId}
          aria-label={t("showDetails")}
        >
          <Info size={19} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </article>
  );
}

export const HoldingCard = memo(HoldingCardInner);
