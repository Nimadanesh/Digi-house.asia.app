// File responsibility: order summary step (Fable Buy Flow §Step 2) — totals per payment rail.
import { usd, ton, estimateNanoTon } from "@/lib/format";
import { positionYieldUsd } from "@/lib/property-yield";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { BuyCurrency } from "@/types/buy";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function BuySummaryStep({
  listing,
  qty,
  currency,
  error,
  pending,
  verifying,
  unitPriceUsd,
}: {
  listing: Listing;
  qty: number;
  /** Payment rail chosen in the qty step — changes how the total is shown. */
  currency: BuyCurrency;
  error?: string | null;
  pending?: boolean;
  /** Payment sent — waiting for on-chain verification + settlement. */
  verifying?: boolean;
  /** Single source of truth (lib/property-price); defaults to list price. */
  unitPriceUsd?: number;
}) {
  const unitPrice = unitPriceUsd ?? listing.sharePriceUsd;
  const totalUsd = qty * unitPrice;
  const weekly = positionYieldUsd(listing, qty).weeklyUsd;
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
          <span className="ml-auto text-sm tnum text-foreground">{usd(unitPrice)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Pay with</span>
          <span className="ml-auto text-sm tnum text-foreground" data-testid="buy-pay-with">
            {currency === "USDT" ? "USDT" : "TON"}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">Fees</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(feesUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="buy-total">
            {currency === "USDT" ? `${usd(totalUsd)} USDT` : `${usd(totalUsd)} · ${ton(estimateNanoTon(totalUsd, TON_PRICE_USD_CENTS))}`}
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
          {verifying
            ? "Confirming on blockchain…"
            : "Confirming in your wallet…"}
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
