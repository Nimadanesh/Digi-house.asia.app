"use client";
// File responsibility: portfolio holding card — property, shares, value, lock/earning state, NFT receipt.
// Display-only redesign; figures unchanged from the Holding contract (monthly estimate = weekly ×52/12,
// the presentation conversion documented in FRACTIONALLUXE-PROGRAM A4).
import { memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { usd, pct } from "@/lib/format";
import { holdingPnl } from "@/lib/portfolio-math";
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
  onOpen,
  lockedShares = 0,
  nftStatus = null,
}: {
  holding: Holding;
  title: string;
  location: string;
  image?: string;
  onOpen: () => void;
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
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[12px] bg-card p-3.5 text-left active:scale-[0.98] transition-transform duration-[120ms] ease-out"
      data-testid={"holding-card-" + holding.propertyId}
    >
      <div className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
          <Image src={cover} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-[0.9375rem] font-semibold leading-snug text-foreground">{title}</p>
          <p className="truncate text-xs leading-relaxed text-muted-foreground">{location}</p>
        </div>
        <div className="shrink-0 space-y-0.5 text-end">
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
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-t border-border pt-2.5">
        <span className="text-xs text-muted-foreground tnum">
          {holding.sharesOwned} {tCommon("shares")}
        </span>
        {lockedShares > 0 ? (
          <span
            className="inline-flex items-center rounded-full bg-primary/12 px-1.5 py-0 text-[0.625rem] font-semibold text-primary tnum"
            data-testid="holding-locked-pill"
          >
            {t("earningPill", { count: lockedShares })}
          </span>
        ) : null}
        {freeShares > 0 ? (
          <span
            className="inline-flex items-center rounded-full bg-muted px-1.5 py-0 text-[0.625rem] font-medium text-muted-foreground tnum"
            data-testid="holding-idle-pill"
          >
            {t("idlePill", { count: freeShares })}
          </span>
        ) : null}
        {nftStatus && nftLabel ? (
          <span className="ms-auto inline-flex items-center gap-1" data-testid="holding-nft-status">
            <span
              className={cn(
                "size-1.5 rounded-full",
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
            <span className="text-[0.6875rem] font-medium leading-relaxed text-muted-foreground">
              {t("nftCollectible")} · {nftLabel}
            </span>
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{t("projectedMonthlyShort")}</span>
        <span className="font-medium text-success tnum" data-testid="holding-monthly">
          {t("estMonthly", { amount: usd(monthlyFromWeeklyUsd(holding.pendingWeekEarningsUsd)) })}
        </span>
      </div>
    </button>
  );
}

export const HoldingCard = memo(HoldingCardInner);
