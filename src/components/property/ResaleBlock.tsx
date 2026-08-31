"use client";
// File responsibility: Estate tab resale block (Phase 9 UI Mapping §5.2 + §8) —
// the secondary market DEMOTED from primary UX. A collapsed "Resale market" expander
// shows current ownership value per share, best asking price / best offer / spread
// and ONE acquisition CTA; the order book, recent fills and the price/OHLC/volume
// charts sit behind a nested "Price history (simulated)" expander (removed from the
// default scroll, existing simulated-data disclosure kept). No new financial logic.
import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { usd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { MarketSummary } from "./MarketSection";
import { OrderBook } from "./OrderBook";
import { RecentTrades } from "./RecentTrades";

const SecondaryPerformanceCharts = dynamic(
  () => import("./SecondaryPerformanceCharts").then((m) => m.SecondaryPerformanceCharts),
  {
    loading: () => (
      <Block className="space-y-3 p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-[200px] w-full" />
      </Block>
    ),
    ssr: false,
  },
);

export function ResaleBlock({
  listing,
  orderBook,
  anchorUsd,
  onBuy,
  open,
  onOpenChange,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  /** Single source of truth (lib/property-price) for the chart anchor + CTA price. */
  anchorUsd: number;
  onBuy: () => void;
  /** Controlled expander — the hero "View Resale Opportunities" CTA opens it. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("property");
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <section className="space-y-2" id="resale-block" data-testid="resale-block">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className="flex w-full items-center justify-between rounded-[12px] bg-surface-2 px-4 py-3 text-left"
        data-testid="resale-toggle"
      >
        <span className="text-[0.9375rem] font-semibold text-foreground">{t("resaleMarketTitle")}</span>
        <span className="flex items-center gap-2">
          <span className="text-sm tnum text-muted-foreground">{usd(anchorUsd)}</span>
          <ChevronDown
            size={18}
            strokeWidth={1.75}
            aria-hidden
            className={cn("transition-transform duration-200 ease-out", open ? "rotate-180" : "")}
          />
        </span>
      </button>

      {open ? (
        <div className="space-y-4" data-testid="resale-block-content">
          <MarketSummary listing={listing} state={orderBook} />

          <button
            type="button"
            onClick={onBuy}
            disabled={orderBook?.bestAskUsd == null}
            className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground transition-transform duration-[120ms] ease-out active:scale-[0.98] disabled:opacity-50"
            data-testid="resale-acquire-cta"
          >
            {t("resaleAcquireCta")}
          </button>

          {/* Demoted: price/OHLC/volume charts + book + recent fills behind an expander. */}
          <Block className="overflow-hidden">
            <button
              type="button"
              aria-expanded={historyOpen}
              onClick={() => setHistoryOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              data-testid="resale-price-history-toggle"
            >
              <span className="text-sm font-medium text-foreground">{t("resalePriceHistory")}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                aria-hidden
                className={cn("transition-transform duration-200 ease-out", historyOpen ? "rotate-180" : "")}
              />
            </button>
            {historyOpen ? (
              <div className="space-y-4 border-t border-border p-4" data-testid="resale-price-history-content">
                <SecondaryPerformanceCharts listing={listing} anchorUsd={anchorUsd} />
                {orderBook ? <OrderBook state={orderBook} maxLevels={4} /> : null}
                <RecentTrades propertyId={listing.id} max={5} />
              </div>
            ) : null}
          </Block>
        </div>
      ) : null}
    </section>
  );
}
