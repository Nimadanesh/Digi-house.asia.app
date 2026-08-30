"use client";
// File responsibility: secondary-market section (REDESIGN-SPEC §9) — market summary
// (current price via lib/property-price, vs-offer delta only when a last trade exists,
// best bid/ask, spread), compact order book, recent trades. Rendered only for
// funded/resale listings; buy/sell actions stay on the sticky bar and PositionCard.
// No financial logic: all figures are existing data routed through lib/format.
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { usd } from "@/lib/format";
import { getCurrentSharePrice } from "@/lib/property-price";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";
import { OrderBook } from "./OrderBook";
import { RecentTrades } from "./RecentTrades";

export function MarketSection({
  listing,
  orderBook,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
}) {
  const t = useTranslations("property");
  return (
    <section className="space-y-2" data-testid="market-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">{t("marketTitle")}</h2>
      <MarketSummary listing={listing} state={orderBook} />
      {orderBook ? (
        <OrderBook state={orderBook} maxLevels={4} />
      ) : (
        <Block className="space-y-2 p-4" data-testid="market-skeleton">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
        </Block>
      )}
      <RecentTrades propertyId={listing.id} max={5} />
    </section>
  );
}

function MarketSummary({ listing, state }: { listing: Listing; state?: OrderBookState }) {
  const t = useTranslations("property");
  // Single source of truth (lib/property-price): best ask ?? last trade ?? list.
  const ask = state?.bestAskUsd ?? state?.asks[0]?.priceUsd;
  const current = getCurrentSharePrice(listing, { bestAskUsd: ask });
  const bid = state?.bestBidUsd ?? state?.bids[0]?.priceUsd;
  // §9: price change only when already computable without new simulated history —
  // the last executed trade vs. the offering price is the one honest delta.
  const hasDelta = listing.lastTradeUsd != null && listing.lastTradeUsd != listing.sharePriceUsd;
  const deltaUp = hasDelta ? listing.lastTradeUsd! >= listing.sharePriceUsd : false;
  const deltaPct =
    hasDelta && listing.sharePriceUsd > 0
      ? (listing.lastTradeUsd! - listing.sharePriceUsd) / listing.sharePriceUsd
      : 0.0;
  const spreadCents = bid != null && ask != null ? ask - bid : null;

  return (
    <Block className="space-y-3 p-4" data-testid="market-summary">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
          {t("currentPrice")}
        </p>
        <span className="text-[0.6875rem] font-semibold leading-none text-foreground tnum" data-testid="market-current-price">
          {usd(current)}
        </span>
        {hasDelta ? (
          <span
            className={`text-[0.6875rem] font-semibold leading-none tnum ${deltaUp ? "text-success" : "text-danger"}`}
            data-testid="market-delta"
          >
            {deltaUp ? "+" : ""}
            {(deltaPct * 100).toFixed(1)}% {t("vsOffer")}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-3 divide-x divide-border" data-testid="best-bid-ask">
        <div className="flex flex-col items-center gap-1 px-2 py-2">
          <span className="text-[1.375rem] font-bold leading-none text-success tnum" data-testid="best-bid">
            {bid != null ? usd(bid) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">{t("bestBid")}</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-2">
          <span className="text-[1.375rem] font-bold leading-none text-danger tnum" data-testid="best-ask">
            {ask != null ? usd(ask) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">{t("bestAsk")}</span>
        </div>
        <div className="flex flex-col items-center gap-1 px-2 py-2">
          <span className="text-[1.375rem] font-bold leading-none text-foreground tnum" data-testid="market-spread">
            {spreadCents != null ? usd(spreadCents) : "—"}
          </span>
          <span className="text-xs text-muted-foreground">{t("spread")}</span>
        </div>
      </div>
    </Block>
  );
}
