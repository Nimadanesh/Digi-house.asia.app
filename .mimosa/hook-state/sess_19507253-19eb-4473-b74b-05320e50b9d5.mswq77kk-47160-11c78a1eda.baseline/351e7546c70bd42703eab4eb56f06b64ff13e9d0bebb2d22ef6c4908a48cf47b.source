"use client";
// File responsibility: holding detail bottom sheet (Fable Portfolio).
import Image from "next/image";
import Link from "next/link";
import { Sheet } from "@/components/common/Sheet";
import { Row } from "@/components/common/Row";
import { Block } from "@/components/common/Block";
import { usd, pct } from "@/lib/format";
import { ROUTES } from "@/lib/constants";
import { holdingPnl } from "@/lib/portfolio-math";
import { haptics } from "@/lib/telegram/haptics";
import type { Holding } from "@/types/position";
import { cn } from "@/lib/utils";

export function HoldingDetailSheet(props: {
  open: boolean;
  onClose: () => void;
  holding: Holding | null;
  title: string;
  location: string;
  image?: string;
}) {
  const { open, onClose, holding, title, location, image } = props;
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

        <Block>
          <Row>
            <span className="text-sm text-muted-foreground">Shares owned</span>
            <span className="ml-auto text-sm tnum text-foreground">{holding.sharesOwned}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Avg cost / share</span>
            <span className="ml-auto text-sm tnum text-foreground">{usd(holding.avgCostUsd)}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Current value</span>
            <span className="ml-auto text-sm tnum text-foreground">{usd(holding.currentValueUsd)}</span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Unrealized PnL</span>
            <span className={cn("ml-auto text-sm tnum font-medium", up ? "text-success" : "text-danger")}>
              {sign}
              {usd(Math.abs(pnl.unrealizedUsd))} ({sign}
              {pct(Math.abs(pnl.unrealizedRatio))})
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">Weekly yield (projected)</span>
            <span className="ml-auto text-sm tnum text-success">{usd(holding.pendingWeekEarningsUsd)}</span>
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
            Buy More
          </Link>
          <button
            type="button"
            disabled
            className="inline-flex h-[48px] w-full items-center justify-center rounded-[10px] bg-surface-2 text-[0.9375rem] font-semibold text-muted-foreground opacity-70"
            data-testid="holding-sell"
          >
            Sell Coming Soon
          </button>
        </div>
      </div>
    </Sheet>
  );
}
