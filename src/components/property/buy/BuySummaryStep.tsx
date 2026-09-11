// File responsibility: order summary step (Fable Buy Flow §Step 2) — totals per payment rail.
// Primary-market commission (approved model): the property Commission Card is authoritative
// when available; until cards are provided the amount-based tier table is the fallback — the
// preview mirrors the server math, the server always computes the actual charge.
import { useState } from "react";
import { pct, usd, ton, estimateNanoTon } from "@/lib/format";
import {
  presentPositionMonthlyIncome,
  getPresentedMonthlyIncome,
  presentedIncomeUnknownCaption,
} from "@/lib/economics/property-presentation";
import { previewBuyQuote } from "@/lib/buy-quote";
import { unavailableLabel } from "@/lib/availability";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { BuyCurrency } from "@/types/buy";
import { useFees } from "@/hooks/useFees";
import { useTranslations } from "next-intl";
import { Block } from "@/components/common/Block";
import { Disclosure } from "@/components/common/Disclosure";
import { Row } from "@/components/common/Row";

export function BuySummaryStep({
  listing,
  qty,
  currency,
  error,
  pending,
  verifying,
  unitPriceUsd,
  displayName,
  displayLocation,
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
  /** Canonical Estate24 name/location (PROMPT 03); fallback listing facts. */
  displayName?: string;
  displayLocation?: string;
}) {
  const t = useTranslations("property");
  const fees = useFees();
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const unitPrice = unitPriceUsd ?? listing.sharePriceUsd;
  // Single total computation shared with the MainButton confirm label.
  const { feesUsd, totalPayableUsd } = previewBuyQuote(qty, unitPrice, fees.data ?? []);
  // Slice 2: projected income from the single presentation layer (V1, or
  // pending) — identical basis to the qty step. No weekly-yield presentation here.
  const monthly = presentPositionMonthlyIncome(listing.id, qty);
  // Slice 3: a pending projection carries its human-readable reason.
  const incomeReason = presentedIncomeUnknownCaption(
    getPresentedMonthlyIncome(listing.id).unknownKind,
  );
  const ownership =
    listing.totalShares > 0
      ? t("buyShareOfEstate", { qty, pct: pct(qty / listing.totalShares) })
      : unavailableLabel("backend_absent");

  return (
    <div className="space-y-3 pb-2" data-testid="buy-summary-step">
      <h2 id="buy-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
        {t("buySummaryTitle")}
      </h2>
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">{t("buySummaryProperty")}</span>
          <span className="ml-auto text-sm text-foreground text-right max-w-[60%] truncate">{displayName ?? listing.title}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("buySummaryLocation")}</span>
          <span className="ml-auto text-sm text-foreground text-right max-w-[60%] truncate">{displayLocation ?? listing.location}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("buySummaryQuantity")}</span>
          <span className="ml-auto text-sm tnum text-foreground">{qty}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("buyOwnership")}</span>
          <span className="ml-auto text-sm tnum text-foreground" data-testid="buy-ownership">{ownership}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("pricePerShareLabel")}</span>
          <span className="ml-auto text-sm tnum text-foreground">{usd(unitPrice)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("buySummaryPayWith")}</span>
          <span className="ml-auto text-sm tnum text-foreground" data-testid="buy-pay-with">
            {currency === "USDT" ? "USDT" : "TON"}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("buySummaryFees")}</span>
          <span className="ml-auto text-sm tnum text-foreground" data-testid="buy-fees">{usd(feesUsd)}</span>
        </Row>
        <Row className="border-t border-border">
          <span className="text-[0.9375rem] font-semibold text-foreground">{t("totalLabel")}</span>
          <span className="ml-auto text-[0.9375rem] tnum font-bold tracking-tight text-foreground" data-testid="buy-total">
            {currency === "USDT" ? `${usd(totalPayableUsd)} USDT` : `${usd(totalPayableUsd)} · ${ton(estimateNanoTon(totalPayableUsd, TON_PRICE_USD_CENTS))}`}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("estMonthlyYield")}</span>
          {/* Projected — never success-green (Paid-only color); the label
              already carries the Projected state. */}
          <span
            className="ml-auto text-sm tnum font-semibold text-foreground"
            data-testid="buy-summary-monthly"
          >
            {monthly != null
              ? usd(monthly)
              : `${unavailableLabel("backend_absent")}${incomeReason != null ? ` — ${incomeReason}` : ""}`}
          </span>
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
        {t("buySummaryCommissionNote")}
      </p>
      <Disclosure
        title={<span className="text-sm text-muted-foreground">{t("buyAssumptionsTitle")}</span>}
        open={assumptionsOpen}
        onOpenChange={setAssumptionsOpen}
        toggleTestId="buy-assumptions-toggle"
        contentTestId="buy-assumptions-content"
        contentClassName="border-t border-border px-4 py-3"
      >
        <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          <p>{t("buyAssumptionRate")}</p>
          <p>{t("buyFirstNote")}</p>
          <p>{t("invPlansNote")}</p>
        </div>
      </Disclosure>
      {pending ? (
        <p
          className="text-center text-sm leading-relaxed text-muted-foreground"
          data-testid="buy-pending"
        >
          {verifying
            ? t("buySummaryConfirmingChain")
            : t("buySummaryConfirmingWallet")}
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
