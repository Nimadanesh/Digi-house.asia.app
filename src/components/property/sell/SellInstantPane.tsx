"use client";
// File responsibility: instant-sale pane (platform buy-back at −7%, funding only) —
// form (free-share context + qty + value/fee/net preview) and review (cost basis,
// gain/loss, fee, net, remaining position + confirm). The 7% flat fee is the
// existing instant rule; gain/loss comes from the shared sell view-model at list
// price. Presentational: state and mutations live in SellSheet.
import { useTranslations } from "next-intl";
import { TrendingDown } from "lucide-react";
import { usd, pct } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import type { SellQuote } from "@/lib/sell-quote";
import { SellQtyStepper } from "./SellQtyStepper";

export function SellInstantPane({
  listingTitle,
  shares,
  max,
  freeShares,
  rangeError,
  gross,
  fee,
  net,
  instantQuote,
  funding,
  reviewing,
  pending,
  ctaDisabled,
  error,
  onSharesChange,
  onReview,
  onBack,
  onConfirm,
}: {
  listingTitle: string;
  shares: number;
  max: number;
  freeShares: number;
  rangeError: boolean;
  gross: number;
  fee: number;
  net: number;
  instantQuote: SellQuote | null;
  funding: boolean;
  reviewing: boolean;
  pending: boolean;
  /** Form review-entry gate (invalid selection or instant window closed). */
  ctaDisabled: boolean;
  error: Error | null;
  onSharesChange: (qty: number) => void;
  onReview: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("property");

  if (reviewing) {
    return (
      <>
        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("propertyLabel")}</span>
            <span className="ml-auto max-w-[60%] truncate text-sm font-medium text-foreground">
              {listingTitle}
            </span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("sharesLabel")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">{shares}</span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("valueRow")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">{usd(gross)}</span>
          </Row>
          {instantQuote?.acquisitionCostUsd != null ? (
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">{t("sellAcquisitionCost")}</span>
              <span className="ml-auto text-sm tnum font-medium text-foreground">
                {usd(instantQuote.acquisitionCostUsd)}
              </span>
            </Row>
          ) : null}
          {instantQuote?.gainLossUsd != null && instantQuote.direction != null ? (
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">{t("sellGainLoss")}</span>
              <span
                data-testid="sell-gain-loss"
                className={`ml-auto text-sm tnum font-semibold ${
                  instantQuote.direction === "gain"
                    ? "text-success"
                    : instantQuote.direction === "loss"
                      ? "text-danger"
                      : "text-muted-foreground"
                }`}
              >
                {instantQuote.direction === "breakEven"
                  ? `${usd(0)} · ${t("sellBreakEven")}`
                  : `${instantQuote.direction === "gain" ? "+" : "−"}${usd(Math.abs(instantQuote.gainLossUsd))} · ${
                      instantQuote.direction === "gain" ? t("sellGain") : t("sellLoss")
                    }`}
              </span>
            </Row>
          ) : null}
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("feeLabel")}</span>
            <span className="ml-auto text-sm tnum font-medium text-danger">−{usd(fee)}</span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm font-medium text-foreground">{t("youReceive")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-success">{usd(net)}</span>
          </Row>
          {instantQuote ? (
            <Row className="!min-h-[48px]">
              <span className="text-sm text-muted-foreground">{t("sellRemainingShares")}</span>
              <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="sell-remaining">
                {instantQuote.sharesRemaining.toLocaleString()} · {pct(instantQuote.remainingOwnershipRatio)}
              </span>
            </Row>
          ) : null}
        </Block>
        {error ? (
          <p className="text-xs text-danger text-center" role="alert" data-testid="instant-sell-error">
            {error.message}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              haptics.selection();
              onBack();
            }}
            className="h-[52px] flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            {t("backCta")}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="h-[52px] flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            data-testid="instant-sell-confirm"
          >
            {pending ? t("sellingPending") : t("confirmSell")}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Block>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">{t("freeSharesLabel")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">{freeShares}</span>
        </Row>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">{t("lockedInOrders")}</span>
          <span className="ml-auto text-sm tnum text-muted-foreground">{t("notSellable")}</span>
        </Row>
      </Block>

      <SellQtyStepper shares={shares} max={max} rangeError={rangeError} onChange={onSharesChange} />

      <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5" data-testid="instant-summary">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("valueRow")}</span>
          <span className="tnum font-semibold text-foreground">{usd(gross)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("feeLabel")}</span>
          <span className="tnum font-medium text-danger">−{usd(fee)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-border pt-1.5">
          <span className="text-muted-foreground">{t("youReceive")}</span>
          <span className="tnum font-semibold text-success">{usd(net)}</span>
        </div>
      </div>
      {!funding ? (
        <p className="text-xs text-danger text-center" role="alert">
          {t("instantSellEnded")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={ctaDisabled}
        onClick={() => {
          haptics.impact("light");
          onReview();
        }}
        className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        data-testid="instant-sell-review"
      >
        {t("reviewSaleCta", { amount: usd(net) })}
      </button>
      <p className="text-[0.6875rem] text-center text-muted-foreground">
        <TrendingDown size={12} strokeWidth={1.75} className="inline me-1 -mt-0.5" aria-hidden />
        {t("platformBuybackNote")}
      </p>
    </>
  );
}
