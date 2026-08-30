"use client";
// File responsibility: Sell sheet on Property detail (PRODUCT-PLAN §0.3 / PC-06).
// Two modes per product spec: Instant (platform buys back at −7%, funding only) and
// Custom price (queued while the primary offering is open, live after sellout).
// Interaction contract: instant sell is irreversible → form → review → confirm →
// completion state (never a silent close). Custom orders are cancellable, so they
// place directly and confirm via toast.
// Copy follows the buy-flow convention (localized via next-intl property.*).
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Minus, Plus, TrendingDown, Clock } from "lucide-react";
import type { Listing } from "@/types/property";
import { usd } from "@/lib/format";
import { INSTANT_SELL_FEE_BPS } from "@/types/sell";
import { haptics } from "@/lib/telegram/haptics";
import { useInstantSell, usePlaceOrder } from "@/hooks/useSells";
import { useUiStore } from "@/stores/ui.store";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

const MODES = [
  { value: "instant", labelKey: "instantMode" },
  { value: "custom", labelKey: "customPriceMode" },
] as const;

type Mode = (typeof MODES)[number]["value"];
type Step = "form" | "review" | "success";

export function SellSheet({
  open,
  onClose,
  listing,
  freeShares,
  avgCostUsd,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  freeShares: number;
  avgCostUsd: number;
}) {
  const t = useTranslations("property");
  const [mode, setMode] = useState<Mode>("instant");
  const [step, setStep] = useState<Step>("form");
  const [shares, setShares] = useState(1);
  // custom price: default to the user's cost, editable in whole dollars (cents input ×100)
  const [priceDollars, setPriceDollars] = useState(
    Math.round(avgCostUsd / 100) || Math.round(listing.sharePriceUsd / 100),
  );
  const instant = useInstantSell();
  const placeOrder = usePlaceOrder();
  const pushToast = useUiStore((s) => s.pushToast);
  // Flow state initializes fresh on each open — parents mount this sheet conditionally
  // (G10), so there is no stale review/success state across opens.

  const max = Math.max(1, freeShares);
  const invalid = shares < 1 || shares > freeShares;
  const funding = listing.status === "funding";

  const gross = shares * listing.sharePriceUsd;
  const fee = Math.floor((gross * INSTANT_SELL_FEE_BPS) / 10_000);
  const net = gross - fee;
  const customProceeds = shares * priceDollars * 100;

  function submitInstant() {
    if (invalid || instant.isPending) return;
    instant.mutate(
      { propertyId: listing.id, shares },
      { onSuccess: () => setStep("success") },
    );
  }

  function submitCustom() {
    if (invalid || placeOrder.isPending) return;
    placeOrder.mutate(
      {
        propertyId: listing.id,
        side: "sell",
        priceUsd: priceDollars * 100,
        quantity: shares,
      },
      {
        onSuccess: () => {
          onClose();
          pushToast("success", t("sellOrderPlacedToast"), t("sellOrderPlacedBody"));
        },
      },
    );
  }

  const pending = instant.isPending || placeOrder.isPending;
  const error = (instant.error ?? placeOrder.error) as Error | null;
  const reviewing = mode === "instant" && step === "review";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy="sell-sheet-title"
      dismissible={!pending && step !== "success"}
    >
      {mode === "instant" && step === "success" ? (
        <div className="space-y-4 pb-3 text-center" data-testid="instant-sell-success">
          <div
            className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15"
            style={{ animation: "dh-fade-in 160ms ease-out" }}
          >
            <Check size={28} strokeWidth={2.25} className="text-success" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h2 id="sell-sheet-title" className="text-[1.0625rem] font-semibold leading-snug text-foreground">
              {t("sellSuccessTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-foreground tnum">
              {shares} {shares === 1 ? t("shareWord") : t("sharesWord")} · {usd(net)}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("creditedNote")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-[48px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
          >
            {t("doneCta")}
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-2" data-testid="sell-sheet">
          <h2 id="sell-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
            {reviewing ? t("confirmInstantSale") : t("sellSheetTitle")}
          </h2>

          {reviewing ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("instantSellReviewBody")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("sellModeAria")}>
              {MODES.map((m) => {
                const selected = mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={selected}
                    aria-label={t("sellModeAriaOf", { mode: t(m.labelKey) })}
                    onClick={() => {
                      haptics.selection();
                      setMode(m.value);
                      setStep("form");
                    }}
                    className={`min-h-[44px] rounded-[12px] text-sm font-semibold transition-colors duration-[120ms] ease-out ${
                      selected
                        ? "bg-primary/15 text-primary"
                        : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {t(m.labelKey)}
                  </button>
                );
              })}
            </div>
          )}

          {reviewing ? (
            <>
              <Block>
                <Row className="!min-h-[48px]">
                  <span className="text-sm text-muted-foreground">{t("propertyLabel")}</span>
                  <span className="ml-auto max-w-[60%] truncate text-sm font-medium text-foreground">
                    {listing.title}
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
                <Row className="!min-h-[48px]">
                  <span className="text-sm text-muted-foreground">{t("feeLabel")}</span>
                  <span className="ml-auto text-sm tnum font-medium text-danger">−{usd(fee)}</span>
                </Row>
                <Row className="!min-h-[48px]">
                  <span className="text-sm font-medium text-foreground">{t("youReceive")}</span>
                  <span className="ml-auto text-sm tnum font-semibold text-success">{usd(net)}</span>
                </Row>
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
                    setStep("form");
                  }}
                  className="h-[52px] flex-1 rounded-[12px] bg-surface-2 text-sm font-medium text-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
                >
                  {t("backCta")}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={submitInstant}
                  className="h-[52px] flex-1 rounded-[12px] bg-primary text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
                  data-testid="instant-sell-confirm"
                >
                  {pending ? t("sellingPending") : t("confirmSell")}
                </button>
              </div>
            </>
          ) : (
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

              <div className="flex items-center justify-center gap-4">
                <button
                  type="button"
                  aria-label={t("decreaseQty")}
                  disabled={shares <= 1}
                  onClick={() => {
                    haptics.selection();
                    setShares((q) => Math.max(1, q - 1));
                  }}
                  className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
                >
                  <Minus size={22} strokeWidth={1.75} />
                </button>
                <div className="min-w-[88px] text-center text-3xl font-semibold tnum" data-testid="sell-qty">
                  {shares}
                </div>
                <button
                  type="button"
                  aria-label={t("increaseQty")}
                  disabled={shares >= max}
                  onClick={() => {
                    haptics.selection();
                    setShares((q) => Math.min(max, q + 1));
                  }}
                  className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
                >
                  <Plus size={22} strokeWidth={1.75} />
                </button>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    haptics.selection();
                    setShares(max);
                  }}
                  className="min-h-[44px] min-w-[52px] rounded-full bg-primary/15 px-3 text-sm font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
                >
                  {t("maxCta")}
                </button>
              </div>
              {invalid ? (
                <p className="text-xs text-danger text-center" role="alert">
                  {t("quantityInvalid", { max: freeShares })}
                </p>
              ) : null}

              {mode === "instant" ? (
                <>
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
                    disabled={invalid || !funding || pending}
                    onClick={() => {
                      haptics.impact("light");
                      setStep("review");
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
              ) : (
                <>
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
                        value={priceDollars}
                        onChange={(e) => setPriceDollars(Math.max(1, Number(e.target.value) || 1))}
                        className="min-h-[48px] w-full bg-transparent text-lg font-semibold tnum text-foreground outline-none"
                        data-testid="sell-price-input"
                      />
                    </div>
                  </div>
                  <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5" data-testid="custom-summary">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("orderValue")}</span>
                      <span className="tnum font-semibold text-foreground">{usd(customProceeds)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("marketFeeLabel")}</span>
                      <span className="tnum font-medium text-muted-foreground">{t("onTrade")}</span>
                    </div>
                  </div>
                  {funding ? (
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
                    disabled={invalid || pending}
                    onClick={submitCustom}
                    className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
                    data-testid="custom-sell-confirm"
                  >
                    {pending
                      ? t("placingPending")
                      : funding
                        ? t("queueSellOrder")
                        : t("placeSellOrder")}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
