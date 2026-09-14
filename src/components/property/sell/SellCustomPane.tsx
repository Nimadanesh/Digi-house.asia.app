"use client";
// File responsibility: custom-price pane — the secondary-market listing flow
// (form → review). Form: owned position, qty, proposed price, live view-model
// quote, buyer-demand context, honest liquidity notes. Review: the confirmation
// summary (what is sold / received / remaining / outcome vs cost) with the
// List-for-Sale action. Presentational: state and mutations live in SellSheet.
import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";
import { usd, pct } from "@/lib/format";
import { haptics } from "@/lib/telegram/haptics";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import type { SellQuote, PriceGuideDirection } from "@/lib/sell-quote";
import { SellQuoteSummary, SellPositionBlock } from "./SellQuoteSummary";
import { SellQtyStepper } from "./SellQtyStepper";

export function SellCustomPane({
  listingTitle,
  totalShares,
  owned,
  avgCostUsd,
  shares,
  max,
  freeShares,
  rangeError,
  priceText,
  priceCents,
  priceInvalid,
  quote,
  bestBid,
  lastPrice,
  marketGuide,
  bookEmpty,
  funding,
  reviewing,
  pending,
  ctaDisabled,
  error,
  onSharesChange,
  onPriceTextChange,
  onReview,
  onBack,
  onConfirm,
}: {
  listingTitle: string;
  totalShares: number;
  owned: number;
  avgCostUsd: number;
  shares: number;
  max: number;
  freeShares: number;
  rangeError: boolean;
  /** Raw editable text — may be "" while the user is typing. */
  priceText: string;
  /** Parsed numeric price (cents); null while empty/invalid — review gates on it. */
  priceCents: number | null;
  priceInvalid: boolean;
  quote: SellQuote | null;
  bestBid: number | null;
  lastPrice: number | null;
  /** Informational guidance only; null = silent. Never feeds the quote. */
  marketGuide: { direction: PriceGuideDirection; refCents: number } | null;
  bookEmpty: boolean;
  funding: boolean;
  reviewing: boolean;
  pending: boolean;
  /** Invalid selection or a mutation in flight. */
  ctaDisabled: boolean;
  error: Error | null;
  onSharesChange: (qty: number) => void;
  onPriceTextChange: (text: string) => void;
  onReview: () => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("property");
  // Locked (unsellable) shares, derived from the actual position — never stored.
  const lockedShares = Math.max(0, owned - freeShares);

  if (reviewing) {
    return (
      <div className="space-y-4" data-testid="sell-review">
        <SellPositionBlock ownedShares={owned} totalShares={totalShares} avgCostUsd={avgCostUsd} />
        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("propertyLabel")}</span>
            <span className="ml-auto max-w-[60%] truncate text-sm font-medium text-foreground">
              {listingTitle}
            </span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("sharesLabel")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">
              {shares} · {quote ? pct(quote.ownershipSoldRatio) : "—"}
            </span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">{t("pricePerShareLabel")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">
              {priceCents != null ? usd(priceCents) : "—"}
            </span>
          </Row>
        </Block>
        <SellQuoteSummary quote={quote} />
        {funding ? (
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
            <Clock size={12} strokeWidth={1.75} className="inline me-1 -mt-0.5" aria-hidden />
            {t("queuedUntilSellout")}
          </p>
        ) : (
          <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
            {t("sellPendingNote")}
          </p>
        )}
        {error ? (
          <p className="text-xs text-danger text-center" role="alert">
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
            disabled={ctaDisabled}
            onClick={onConfirm}
            className="h-[52px] flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
            data-testid="custom-sell-confirm"
          >
            {pending
              ? t("placingPending")
              : funding
                ? t("queueSellOrder")
                : t("listForSale")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SellPositionBlock ownedShares={owned} totalShares={totalShares} avgCostUsd={avgCostUsd} />
      <Block>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">{t("sellAvailableToSell")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">
            {t("nShares", { count: freeShares })}
          </span>
        </Row>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">{t("positionLocked")}</span>
          <span className="ml-auto text-sm tnum text-muted-foreground">
            {lockedShares > 0
              ? `${lockedShares.toLocaleString()} · ${t("notSellable")}`
              : lockedShares.toLocaleString()}
          </span>
        </Row>
      </Block>

      <SellQtyStepper shares={shares} max={max} rangeError={rangeError} onChange={onSharesChange} />

      <Block>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">{t("bestBid")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">
            {bestBid != null ? usd(bestBid) : "—"}
          </span>
        </Row>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">{t("lastPrice")}</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground">
            {lastPrice != null ? usd(lastPrice) : "—"}
          </span>
        </Row>
      </Block>

      <div className="space-y-2">
        <label htmlFor="sell-price" className="text-sm text-muted-foreground">
          {t("pricePerShareLabel")}
        </label>
        <div className="flex items-center gap-2 rounded-[12px] bg-surface-2 px-3">
          <span className="text-sm font-semibold text-muted-foreground">$</span>
          <input
            id="sell-price"
            type="number"
            min={1}
            step={1}
            value={priceText}
            onChange={(e) => onPriceTextChange(e.target.value)}
            className="min-h-[48px] w-full bg-transparent text-lg font-semibold tnum text-foreground outline-none"
            data-testid="sell-price-input"
          />
        </div>
      </div>
      {priceInvalid ? (
        <p className="text-xs text-danger text-center" role="alert">
          {t("sellInvalidPrice")}
        </p>
      ) : null}
      {marketGuide != null ? (
        <p
          className="text-[0.6875rem] leading-relaxed text-muted-foreground"
          data-testid="sell-price-guide"
        >
          {marketGuide.direction === "above"
            ? t("sellPriceAboveMarket")
            : t("sellPriceBelowMarket", { price: usd(marketGuide.refCents) })}
        </p>
      ) : null}
      <SellQuoteSummary quote={quote} />
      {bookEmpty ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          {t("sellNoBuyerBody")}
        </p>
      ) : funding ? (
        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          <Clock size={12} strokeWidth={1.75} className="inline me-1 -mt-0.5" aria-hidden />
          {t("queuedUntilSellout")}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-danger text-center" role="alert">
          {error.message}
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
        data-testid="custom-sell-review"
      >
        {t("reviewListingCta")}
      </button>
    </>
  );
}
