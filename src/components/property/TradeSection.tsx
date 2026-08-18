"use client";
// File responsibility: secondary-market trade section on Property detail (PD-06).
// Rendered only for resale/funded properties (book is open). Two-sided order book with
// depth bars + last price, recent trades, and Buy / Sell actions opening the limit sheets.
import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { haptics } from "@/lib/telegram/haptics";
import { usePortfolio, useLocks, activeLocksForProperty } from "@/hooks";
import { OrderBook } from "./OrderBook";
import { RecentTrades } from "./RecentTrades";
import { LimitBuySheet } from "./LimitBuySheet";
import { SellSheet } from "./SellSheet";
import { Block } from "@/components/common/Block";
import { Skeleton } from "@/components/common/Skeleton";

export function TradeSection({
  listing,
  orderBook,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
}) {
  const [buyOpen, setBuyOpen] = useState(false);
  const [sellOpen, setSellOpen] = useState(false);
  const portfolio = usePortfolio();
  const locksQuery = useLocks();

  const holding = portfolio.data?.holdings.find((h) => h.propertyId === listing.id);
  const activeLocks = activeLocksForProperty(locksQuery.data?.locks, listing.id);
  const lockedShares = activeLocks.reduce((s, l) => s + l.shares, 0);
  const owned = holding?.sharesOwned ?? 0;
  const free = Math.max(0, owned - lockedShares);
  const avgCost = holding?.avgCostUsd ?? listing.sharePriceUsd;

  return (
    <section className="space-y-2" data-testid="trade-section">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">Market</h2>
      {orderBook ? (
        <OrderBook state={orderBook} />
      ) : (
        <Block className="p-4 space-y-2" data-testid="orderbook-skeleton">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-6 w-3/5" />
        </Block>
      )}
      <RecentTrades propertyId={listing.id} />
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            haptics.impact("light");
            setBuyOpen(true);
          }}
          className="flex h-[48px] items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-semibold text-primary-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="open-limit-buy"
        >
          <ArrowDownToLine size={18} strokeWidth={1.75} />
          Buy
        </button>
        <button
          type="button"
          onClick={() => {
            haptics.impact("light");
            setSellOpen(true);
          }}
          className="flex h-[48px] items-center justify-center gap-2 rounded-[12px] border border-border bg-transparent px-4 text-sm font-semibold text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out"
          data-testid="open-limit-sell"
        >
          <ArrowUpFromLine size={18} strokeWidth={1.75} />
          Sell
        </button>
      </div>

      <LimitBuySheet
        open={buyOpen}
        onClose={() => setBuyOpen(false)}
        listing={listing}
        orderBook={orderBook}
      />
      <SellSheet
        open={sellOpen}
        onClose={() => setSellOpen(false)}
        listing={listing}
        freeShares={free}
        avgCostUsd={avgCost}
      />
    </section>
  );
}
