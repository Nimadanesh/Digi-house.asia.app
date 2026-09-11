"use client";
// File responsibility: listed-state panel for a created resale order — Active,
// Pending Liquidity, No Buyer, Partially Filled, Sold, Queued, Cancelled.
// Derives the state from the existing order + live book (resolveSellListingStatus);
// Active is never Sold. Cancellation reflects backend confirmation via the
// caller's mutation (this panel only arms/confirms the intent).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { usd, pct } from "@/lib/format";
import { bpsToPct } from "@/types/fees";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { StatusPill } from "@/components/common/StatusPill";
import type { Order, OrderBookState } from "@/types/order";
import { resolveSellListingStatus, type SellQuote } from "@/lib/sell-quote";

function StatusMeta({ status }: { status: ReturnType<typeof resolveSellListingStatus> }) {
  const t = useTranslations("property");
  switch (status) {
    case "queued":
      return <StatusPill label={t("sellStatusQueued")} variant="warning" />;
    case "active":
      return <StatusPill label={t("sellStatusActive")} variant="warning" />;
    case "pendingLiquidity":
      return <StatusPill label={t("sellStatusPending")} variant="warning" />;
    case "noLiquidity":
      return <StatusPill label={t("sellStatusNoBuyer")} variant="warning" />;
    case "partiallyFilled":
      return <StatusPill label={t("sellStatusPartial")} variant="warning" />;
    case "filled":
      return <StatusPill label={t("sellStatusSold")} variant="success" />;
    case "cancelled":
    case "rejected":
      return <StatusPill label={t("sellStatusCancelled")} variant="danger" />;
  }
}

export function SellListingStatus({
  order,
  book,
  quote,
  cancelling,
  cancelError,
  onCancel,
  onDone,
  listingName,
}: {
  order: Order;
  /** Live book when known; undefined = unknown → generic pending (never "no buyer"). */
  book?: OrderBookState | null;
  /** Placement-time preview (gross/fee/net/remaining) for the same qty + price. */
  quote: SellQuote | null;
  cancelling: boolean;
  cancelError: string | null;
  onCancel: (orderId: string) => void;
  onDone: () => void;
  /** Canonical estate name for orientation (PROMPT 04 Matrix identity.name primary). */
  listingName?: string | null;
}) {
  const t = useTranslations("property");
  const [armed, setArmed] = useState(false);
  const status = resolveSellListingStatus(order, book ?? null);
  const cancellable =
    (order.status === "open" || order.status === "queued") && status !== "cancelled";

  const gross = order.quantity * order.priceUsd;
  const remainingAfter = quote?.sharesRemaining;
  // Same preview object as Review — never recalculated here.
  const remainingOwnershipRatio = quote?.remainingOwnershipRatio;

  return (
    <div className="space-y-4 pb-2" data-testid="sell-listed">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[1.0625rem] font-semibold text-foreground" data-testid="sell-listed-title">
          {status === "filled"
            ? t("sellStatusSold")
            : status === "queued"
              ? t("sellQueuedTitle")
              : status === "cancelled" || status === "rejected"
                ? t("sellCancelledTitle")
                : t("sellListedTitle")}
        </h2>
        <StatusMeta status={status} />
      </div>
      {listingName ? (
        <p className="truncate text-sm text-muted-foreground" data-testid="sell-listed-estate">
          {listingName}
        </p>
      ) : null}

      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">{t("sharesLabel")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">
            {order.filledQuantity > 0 && status !== "filled"
              ? t("sellPartialBody", { filled: order.filledQuantity, quantity: order.quantity })
              : order.quantity}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("pricePerShareLabel")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">{usd(order.priceUsd)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("orderValue")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">{usd(gross)}</span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">
            {t("marketFeeLabel")}
            {quote?.feeRateBps != null ? ` (${bpsToPct(quote.feeRateBps)})` : ""}
          </span>
          <span className="tnum font-medium text-muted-foreground ml-auto text-sm">
            {quote?.feeUsd == null ? t("onTrade") : usd(quote.feeUsd)}
          </span>
        </Row>
        <Row>
          <span className="text-sm font-medium text-foreground">{t("youReceive")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-success">
            {quote?.netProceedsUsd == null ? "—" : usd(quote.netProceedsUsd)}
          </span>
        </Row>
        {remainingAfter != null ? (
          <Row>
            <span className="text-sm text-muted-foreground">{t("sellRemainingShares")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">
              {remainingAfter.toLocaleString()}
              {remainingOwnershipRatio != null ? ` · ${pct(remainingOwnershipRatio)}` : ""}
            </span>
          </Row>
        ) : null}
      </Block>

      {status === "queued" ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="sell-liquidity-note">
          {t("queuedUntilSellout")}
        </p>
      ) : null}
      {status === "active" || status === "pendingLiquidity" ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="sell-liquidity-note">
          {t("sellPendingNote")}
        </p>
      ) : null}
      {status === "noLiquidity" ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="sell-liquidity-note">
          {t("sellNoBuyerBody")}
        </p>
      ) : null}
      {status === "cancelled" || status === "rejected" ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="sell-liquidity-note">
          {t("sellCancelledBody")}
        </p>
      ) : null}

      {cancelError ? (
        <p className="text-xs text-danger text-center" role="alert">
          {cancelError}
        </p>
      ) : null}

      {cancellable ? (
        armed ? (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={cancelling}
              onClick={() => {
                haptics.selection();
                setArmed(false);
              }}
              className="h-[52px] flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            >
              {t("backCta")}
            </button>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => onCancel(order.id)}
              className="h-[52px] flex-1 rounded-[12px] bg-danger/15 text-sm font-semibold text-danger active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="sell-cancel-confirm"
            >
              {cancelling ? t("sellCancelling") : t("sellCancelConfirm")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              haptics.selection();
              setArmed(true);
            }}
            className="h-[52px] w-full rounded-[12px] border border-border bg-transparent text-sm font-semibold text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
            data-testid="sell-cancel"
          >
            {t("sellCancelListing")}
          </button>
        )
      ) : null}

      <button
        type="button"
        onClick={onDone}
        className="h-[48px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
        data-testid="sell-listed-done"
      >
        {t("doneCta")}
      </button>
    </div>
  );
}
