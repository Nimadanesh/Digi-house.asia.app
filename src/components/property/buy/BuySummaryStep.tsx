// File responsibility: order summary step (Fable Buy Flow §Step 2).
import { usd, ton, weeklyRent, projectedYield, estimateNanoTon } from "@/lib/format";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function BuySummaryStep({
  listing,
  qty,
  error,
  pending,
}: {
  listing: Listing;
  qty: number;
  error?: string | null;
  pending?: boolean;
}) {
  const totalUsd = qty * listing.sharePriceUsd;
  const weekly = projectedYield(weeklyRent(listing.annualRentUsd), qty, listing.totalShares);
  const feesUsd = 0;

  return (
    <div className="space-y-3 pb-2" data-testid="buy-summary-step">
      <h2 id="buy-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
        Order summary
      </h2>
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">Property</span>
          <span className="ml-auto text-sm text-foreground text-right max-w-[60%] truncate">{listing.title}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Quantity</span>
          <span className="ml-auto text-sm tnum text-foreground">{qty}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Price / share</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(listing.sharePriceUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Fees</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(feesUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="buy-total">
            {usd(totalUsd)} · {ton(estimateNanoTon(totalUsd, TON_PRICE_USD_CENTS))}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Est. weekly yield</span>
          <span className="ml-auto text-sm tnum text-success font-medium">{usd(weekly)}</span>
        </Row>
      </Block>
      <p className="mt-0.5 px-0.5 pb-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
        No hidden fees. Total equals quantity × price per share.
      </p>
      {pending ? (
        <p
          className="text-center text-sm leading-relaxed text-muted-foreground"
          data-testid="buy-pending"
        >
          Confirming in your wallet…
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-danger text-center" role="alert" data-testid="buy-summary-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
