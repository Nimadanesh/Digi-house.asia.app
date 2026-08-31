// File responsibility: order summary step (Fable Buy Flow §Step 2) — totals per payment rail.
// Primary-market commission (approved model): the property Commission Card is authoritative
// when available; until cards are provided the amount-based tier table is the fallback — the
// preview mirrors the server math, the server always computes the actual charge.
import { usd, ton, estimateNanoTon } from "@/lib/format";
import { positionYieldUsd } from "@/lib/property-yield";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { BuyCurrency } from "@/types/buy";
import { previewFeeUsd } from "@/types/fees";
import { useFees } from "@/hooks/useFees";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("property");
  const fees = useFees();
  const unitPrice = unitPriceUsd ?? listing.sharePriceUsd;
  const totalUsd = qty * unitPrice;
  const weekly = positionYieldUsd(listing, qty).weeklyUsd;
  // Primary-market commission preview (tier fallback — the Commission Card seam stays null).
  const feesUsd = previewFeeUsd(fees.data ?? [], totalUsd, "buy_primary") ?? 0;
  const totalPayableUsd = totalUsd + feesUsd;

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
          <span className="ml-auto text-sm tnum text-foreground" data-testid="buy-fees">{usd(feesUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm font-medium text-foreground">Total</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="buy-total">
            {currency === "USDT" ? `${usd(totalPayableUsd)} USDT` : `${usd(totalPayableUsd)} · ${ton(estimateNanoTon(totalPayableUsd, TON_PRICE_USD_CENTS))}`}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("estWeeklyYield")}</span>
          <span className="ml-auto text-sm tnum text-success font-medium">{usd(weekly)}</span>
        </Row>
        {/* Owner Stay — honest unavailable state in the purchase review (redesign §8). */}
        <Row>
          <span className="text-sm text-muted-foreground">{t("buyOwnerStay")}</span>
          <span className="ml-auto text-sm text-muted-foreground" data-testid="buy-owner-stay-pending">
            {t("buyOwnerStayPending")}
          </span>
        </Row>
      </Block>
      <p className="mt-0.5 px-0.5 pb-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Total includes the primary-market commission. No other fees.
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
