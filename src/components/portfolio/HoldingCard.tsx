"use client";
// File responsibility: portfolio holding list card (Fable Portfolio My Properties).
import Image from "next/image";
import { ArrowUp, ArrowDown } from "lucide-react";
import { usd, pct } from "@/lib/format";
import { holdingPnl } from "@/lib/portfolio-math";
import type { Holding } from "@/types/position";
import { cn } from "@/lib/utils";

export function HoldingCard({
  holding,
  title,
  location,
  image,
  onOpen,
}: {
  holding: Holding;
  title: string;
  location: string;
  image?: string;
  onOpen: () => void;
}) {
  const { unrealizedUsd, unrealizedRatio } = holdingPnl(holding);
  const up = unrealizedUsd >= 0;
  const sign = up ? "+" : "-";
  const cover = image || "/images/properties/p1.png";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-[12px] bg-card p-3 text-left active:scale-[0.99] transition-transform duration-[120ms] ease-out"
      data-testid={"holding-card-" + holding.propertyId}
    >
      <div className="flex items-start gap-3">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
          <Image src={cover} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[0.9375rem] font-semibold text-foreground">{title}</p>
              <p className="truncate text-xs text-muted-foreground">{location}</p>
            </div>
            <div
              className={cn(
                "shrink-0 text-right text-xs font-semibold tnum",
                up ? "text-success" : "text-danger",
              )}
              data-testid="holding-pnl"
            >
              <span className="inline-flex items-center gap-0.5">
                {up ? <ArrowUp size={12} strokeWidth={2.25} aria-hidden /> : <ArrowDown size={12} strokeWidth={2.25} aria-hidden />}
                {sign}{pct(Math.abs(unrealizedRatio))}
              </span>
              <div className="mt-0.5">{sign}{usd(Math.abs(unrealizedUsd))}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-2.5">
        <div>
          <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Shares</p>
          <p className="mt-0.5 text-sm font-semibold tnum text-foreground">{holding.sharesOwned}</p>
        </div>
        <div>
          <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Value</p>
          <p className="mt-0.5 text-sm font-semibold tnum text-foreground">{usd(holding.currentValueUsd)}</p>
        </div>
        <div>
          <p className="text-[0.625rem] uppercase tracking-wide text-muted-foreground">Weekly</p>
          <p className="mt-0.5 text-sm font-semibold tnum text-success">{usd(holding.pendingWeekEarningsUsd)}</p>
        </div>
      </div>
    </button>
  );
}
