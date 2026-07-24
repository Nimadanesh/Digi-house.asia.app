"use client";
// File responsibility: compose the Property detail layout. Read-only; Buy is the screen primary action.
import { usd, weeklyRent, pct } from "@/lib/format";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { FundingBar } from "./FundingBar";
import { OrderBook } from "./OrderBook";
import { BuyControl } from "./BuyControl";

export function PropertyDetail({
  listing,
  orderBook,
  onConfirm,
}: {
  listing: Listing;
  orderBook?: OrderBookState;
  onConfirm?: (qty: number) => void;
}) {
  const funded = listing.fundingProgressRatio >= 1;
  const weeklyPool = weeklyRent(listing.annualRentUsd);
  return (
    <div className="space-y-4 pb-4">
      <div className="aspect-[16/10] rounded-[12px] bg-surface-2" aria-hidden />
      <div>
        <h1 className="text-[1.0625rem] font-semibold text-foreground">{listing.title}</h1>
        <p className="text-sm text-muted-foreground">{listing.location}</p>
        <p className="text-sm text-foreground mt-2">{listing.description}</p>
      </div>
      <Block>
        <Row><span className="text-sm text-muted-foreground">Total value</span><span className="ml-auto text-sm tnum text-foreground">{usd(listing.sharePriceUsd * listing.totalShares)}</span></Row>
        <Row><span className="text-sm text-muted-foreground">Per share</span><span className="ml-auto text-sm tnum text-foreground">{usd(listing.sharePriceUsd)}</span></Row>
        <Row><span className="text-sm text-muted-foreground">Shares remaining</span><span className="ml-auto text-sm tnum text-foreground">{listing.sharesRemaining} / {listing.totalShares}</span></Row>
      </Block>

      {/* Weekly-Yield block row [HERO R-5.4] */}
      <Block>
        <Row><span className="text-sm text-muted-foreground">Weekly rent pool</span><span className="ml-auto text-sm tnum text-success font-medium">{usd(weeklyPool)}</span></Row>
        <Row><span className="text-sm text-muted-foreground">Payout day</span><span className="ml-auto text-sm text-foreground">Every Friday</span></Row>
      </Block>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">{funded ? "Fully funded" : "Funding progress"}</span>
          <span className="text-xs text-foreground tnum">{pct(listing.fundingProgressRatio)}</span>
        </div>
        <FundingBar progress={listing.fundingProgressRatio} funded={funded} />
      </div>

      {orderBook ? <OrderBook state={orderBook} /> : null}

      <Block className="p-4">
        <BuyControl listing={listing} onConfirm={onConfirm} />
      </Block>
    </div>
  );
}