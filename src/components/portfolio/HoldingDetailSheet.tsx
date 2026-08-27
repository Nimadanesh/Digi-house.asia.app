"use client";
// File responsibility: holding detail bottom sheet (redesign). Localized rows; figures unchanged.
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Sheet } from "@/components/common/Sheet";
import { Row } from "@/components/common/Row";
import { Block } from "@/components/common/Block";
import { shortAddr, usd, pct } from "@/lib/format";
import { monthlyFromWeeklyUsd } from "@/lib/payout-display";
import { ROUTES } from "@/lib/constants";
import { holdingPnl } from "@/lib/portfolio-math";
import { haptics } from "@/lib/telegram/haptics";
import type { Holding } from "@/types/position";
import type { HoldingNft, NftStatus } from "@/types/nft";
import { cn } from "@/lib/utils";

const EXPLORER_BASE = "https://testnet.tonviewer.com";

const NFT_STATUS_DOT: Record<NftStatus, string> = {
  pending: "bg-muted-foreground/50",
  minting: "bg-primary",
  minted: "bg-primary",
  transferring: "bg-primary",
  delivered: "bg-success",
  failed: "bg-danger",
};

export function HoldingDetailSheet(props: {
  open: boolean;
  onClose: () => void;
  holding: Holding | null;
  title: string;
  location: string;
  image?: string;
  /** Collectible-NFT receipt for this holding (display-only). */
  nft?: HoldingNft | null;
}) {
  const { open, onClose, holding, title, location, image, nft } = props;
  const t = useTranslations("portfolio");
  const nftLabel: Record<NftStatus, string> = {
    pending: t("nftStatusPending"),
    minting: t("nftStatusMinting"),
    minted: t("nftStatusMinted"),
    transferring: t("nftStatusTransferring"),
    delivered: t("nftStatusDelivered"),
    failed: t("nftStatusFailed"),
  };
  if (!holding) {
    return (
      <Sheet open={open} onClose={onClose} labelledBy="holding-sheet-title">
        {null}
      </Sheet>
    );
  }
  const pnl = holdingPnl(holding);
  const up = pnl.unrealizedUsd >= 0;
  const sign = up ? "+" : "-";
  const cover = image || "/images/properties/p1.png";

  return (
    <Sheet open={open} onClose={onClose} labelledBy="holding-sheet-title">
      <div className="space-y-4 pb-2" data-testid="holding-detail-sheet">
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
            <Image src={cover} alt="" fill className="object-cover" sizes="56px" />
          </div>
          <div className="min-w-0 space-y-1.5">
            <h2 id="holding-sheet-title" className="truncate text-[1.0625rem] font-semibold leading-snug text-foreground">
              {title}
            </h2>
            <p className="truncate text-sm leading-relaxed text-muted-foreground">{location}</p>
          </div>
        </div>

        {nft ? (
          <Block data-testid="holding-nft-block">
            <Row className="!min-h-[44px]">
              <span className="text-sm text-muted-foreground">{t("nftCollectible")}</span>
              <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium tnum text-foreground">
                <span className={cn("size-1.5 rounded-full", NFT_STATUS_DOT[nft.status])} aria-hidden />
                {nftLabel[nft.status]}
              </span>
            </Row>
            {nft.nftItemId != null ? (
              <Row>
                <span className="text-sm text-muted-foreground">{t("nftItem")}</span>
                <span className="ml-auto text-sm tnum text-foreground">#{nft.nftItemId}</span>
              </Row>
            ) : null}
            {nft.collectionAddress ? (
              <Row>
                <span className="text-sm text-muted-foreground">{t("collection")}</span>
                <span className="ml-auto max-w-[55%] truncate font-mono text-sm tnum text-muted-foreground">
                  {shortAddr(nft.collectionAddress, { prefix: 6, suffix: 6 })}
                </span>
              </Row>
            ) : null}
            {nft.nftAddress ? (
              <Row>
                <span className="text-sm text-muted-foreground">{t("viewOnExplorer")}</span>
                <a
                  href={`${EXPLORER_BASE}/${nft.nftAddress}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  onClick={() => haptics.selection()}
                  className="ml-auto max-w-[55%] truncate font-mono text-sm tnum text-primary"
                  data-testid="holding-nft-explorer"
                >
                  {shortAddr(nft.nftAddress, { prefix: 6, suffix: 6 })}
                </a>
              </Row>
            ) : null}
            <p className="px-4 pb-3 pt-1 text-[0.6875rem] leading-relaxed text-muted-foreground">
              {t("nftDisclaimer")}
            </p>
          </Block>
        ) : null}

        <Block>
          <Row>
            <span className="text-sm text-muted-foreground">{t("sharesOwned")}</span>
            <span className="ml-auto text-sm tnum text-foreground">{holding.sharesOwned}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("avgCostPerShare")}</span>
            <span className="ml-auto text-sm tnum text-foreground">{usd(holding.avgCostUsd)}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("currentValueRow")}</span>
            <span className="ml-auto text-sm tnum text-foreground">{usd(holding.currentValueUsd)}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("unrealizedPnl")}</span>
            <span className={cn("ml-auto text-sm tnum font-medium", up ? "text-success" : "text-danger")}>
              {sign}
              {usd(Math.abs(pnl.unrealizedUsd))} ({sign}
              {pct(Math.abs(pnl.unrealizedRatio))})
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("projectedMonthlyYield")}</span>
            <span
              className="ml-auto text-sm font-medium tnum text-success"
              data-testid="holding-monthly-yield"
            >
              ≈ {usd(monthlyFromWeeklyUsd(holding.pendingWeekEarningsUsd))}
            </span>
          </Row>
        </Block>

        <div className="flex flex-col gap-2">
          <Link
            href={ROUTES.property(holding.propertyId)}
            onClick={() => {
              haptics.selection();
              onClose();
            }}
            className="inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
            data-testid="holding-buy-more"
          >
            {t("buyMore")}
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-surface-2 text-[0.9375rem] font-semibold text-muted-foreground opacity-70"
            data-testid="holding-sell"
          >
            {t("sellComingSoon")}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
