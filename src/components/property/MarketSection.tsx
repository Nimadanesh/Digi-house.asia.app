"use client";
// File responsibility: secondary-market section (Phase 4) — Best Bid/Ask highlight,
// compact order book, recent trades. Rendered only for funded/resale listings;
// buy/sell actions stay on the sticky bar until Phase 7 wires the flows.
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { usd } from "@/lib/format";
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
  return (
    <section className="space-y-2" data-testid="market-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">Market</h2>
      <BestBidAsk state={orderBook} />
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

function BestBidAsk({ state }: { state?: OrderBookState }) {
  const bestBid = state?.bestBidUsd ?? state?.bids[0]?.priceUsd;
  const bestAsk = state?.bestAskUsd ?? state?.asks[0]?.priceUsd;

  return (
    <Block className="grid grid-cols-2 divide-x divide-border" data-testid="best-bid-ask">
      <div className="flex flex-col items-center gap-1 px-4 py-3">
        <span className="text-[1.375rem] font-bold leading-none text-success tnum" data-testid="best-bid">
          {bestBid != null ? usd(bestBid) : "—"}
        </span>
        <span className="text-xs text-muted-foreground">Best Bid</span>
      </div>
      <div className="flex flex-col items-center gap-1 px-4 py-3">
        <span className="text-[1.375rem] font-bold leading-none text-danger tnum" data-testid="best-ask">
          {bestAsk != null ? usd(bestAsk) : "—"}
        </span>
        <span className="text-xs text-muted-foreground">Best Ask</span>
      </div>
    </Block>
  );
}
