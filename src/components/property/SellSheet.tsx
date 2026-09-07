"use client";
// File responsibility: Sell sheet orchestrator on Property detail (PRODUCT-PLAN
// §0.3 / PC-06) — mode + step state, the shared sell view-model, and mutations.
// Instant (platform buy-back, funding only) and Custom price (secondary listing:
// form → review → listed with Active / Pending / No-buyer / Sold / Cancelled
// from the existing order lifecycle) render in their own panes; the instant
// completion and the listed status render inline. Listed is never Sold.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { Listing } from "@/types/property";
import type { Order, OrderBookState } from "@/types/order";
import { usd } from "@/lib/format";
import { INSTANT_SELL_FEE_BPS } from "@/types/sell";
import { haptics } from "@/lib/telegram/haptics";
import { useInstantSell, usePlaceOrder, useCancelOrder } from "@/hooks/useSells";
import { useFees } from "@/hooks/useFees";
import { getEstate24ByRuntimeId } from "@/lib/economics/estates/estate-24-data";
import { Sheet } from "@/components/common/Sheet";
import {
  hasSellIssues,
  previewSellQuote,
  priceGuidance,
  selectMarketReference,
  validateSellSelection,
} from "@/lib/sell-quote";
import { SellInstantPane } from "./sell/SellInstantPane";
import { SellCustomPane } from "./sell/SellCustomPane";
import { SellListingStatus } from "./sell/SellListingStatus";

const MODES = [
  { value: "instant", labelKey: "instantMode" },
  { value: "custom", labelKey: "customPriceMode" },
] as const;

type Mode = (typeof MODES)[number]["value"];
type Step = "form" | "review" | "success" | "listed";

export function SellSheet({
  open,
  onClose,
  listing,
  freeShares,
  avgCostUsd,
  ownedShares,
  orderBook,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  freeShares: number;
  avgCostUsd: number;
  /** Actual owned shares (for the remaining position); falls back to freeShares. */
  ownedShares?: number;
  /** Live book when known; undefined = unknown → generic pending (never "no buyer"). */
  orderBook?: OrderBookState | null;
}) {
  const t = useTranslations("property");
  // Instant buy-back exists only while the primary offering is open — otherwise
  // open directly on the Custom price resale path (never a dead-end default).
  const [mode, setMode] = useState<Mode>(listing.status === "funding" ? "instant" : "custom");
  const [step, setStep] = useState<Step>("form");
  const [shares, setShares] = useState(1);
  // Raw editable price text — the empty string is a legal editing state.
  // Validation and the quote derive from the parsed value separately; the input
  // is never clamped or restored while typing (no Math.max / fallback here).
  const [priceText, setPriceText] = useState<string>(
    String(Math.round(avgCostUsd / 100) || Math.round(listing.sharePriceUsd / 100)),
  );
  const parsedPriceDollars = /^\d+$/.test(priceText) ? Number(priceText) : NaN;
  const priceCents = parsedPriceDollars * 100;
  const [listedOrder, setListedOrder] = useState<Order | null>(null);
  const instant = useInstantSell();
  const placeOrder = usePlaceOrder();
  const cancelOrder = useCancelOrder();
  const fees = useFees();
  // Flow state initializes fresh on each open — parents mount this sheet conditionally
  // (G10), so there is no stale review/success state across opens.

  const owned = ownedShares ?? freeShares;
  const max = Math.max(1, freeShares);
  const funding = listing.status === "funding";
  // PROMPT 03: canonical Estate24 name for user-visible property facts.
  const displayTitle = getEstate24ByRuntimeId(listing.id)?.name ?? listing.title;

  const issues = validateSellSelection({
    quantity: shares,
    pricePerShareUsd: priceCents,
    freeShares,
  });
  const invalid = hasSellIssues(issues);
  const rangeError = issues.exceedsSellable || (issues.invalidQuantity && shares !== 0);
  // Numeric price only when the text parses to a positive integer amount.
  // Empty/zero/negative stay selectable but are never quoted or submitted.
  const validPriceCents = issues.invalidPrice ? null : priceCents;

  // Live view-model preview (null while the selection is invalid — never guessed).
  let quote = null;
  if (!issues.invalidQuantity && !issues.exceedsSellable && !issues.invalidPrice) {
    try {
      quote = previewSellQuote({
        quantity: shares,
        pricePerShareUsd: priceCents,
        acquisitionPricePerShareUsd: avgCostUsd,
        sharesOwned: owned,
        totalShares: listing.totalShares,
        feeTiers: fees.data ?? [],
      });
    } catch {
      quote = null;
    }
  }
  // Instant-sale gain/loss uses the same model at list price; the 7% flat fee is
  // the existing instant rule (not a tier preview), so tiers are left empty here.
  let instantQuote = null;
  if (!issues.invalidQuantity && !issues.exceedsSellable) {
    try {
      instantQuote = previewSellQuote({
        quantity: shares,
        pricePerShareUsd: listing.sharePriceUsd,
        acquisitionPricePerShareUsd: avgCostUsd,
        sharesOwned: owned,
        totalShares: listing.totalShares,
        feeTiers: [],
      });
    } catch {
      instantQuote = null;
    }
  }

  const gross = shares * listing.sharePriceUsd;
  const fee = Math.floor((gross * INSTANT_SELL_FEE_BPS) / 10_000);
  const net = gross - fee;

  function submitInstant() {
    if (invalid || instant.isPending) return;
    instant.mutate(
      { propertyId: listing.id, shares },
      { onSuccess: () => setStep("success") },
    );
  }

  function submitCustom() {
    if (invalid || validPriceCents == null || placeOrder.isPending) return;
    placeOrder.mutate(
      {
        propertyId: listing.id,
        side: "sell",
        priceUsd: validPriceCents,
        quantity: shares,
      },
      {
        onSuccess: (data) => {
          setListedOrder(data);
          setStep("listed");
        },
      },
    );
  }

  function cancelListing(orderId: string) {
    if (cancelOrder.isPending) return;
    cancelOrder.mutate(orderId, {
      // Reflect the backend confirmation — never flip the state optimistically.
      onSuccess: () =>
        setListedOrder((prev) => (prev ? { ...prev, status: "cancelled" } : prev)),
    });
  }

  const pending = instant.isPending || placeOrder.isPending;
  const reviewing = step === "review";
  const listed = mode === "custom" && step === "listed" && listedOrder != null;

  const lastPrice = orderBook?.lastTradeUsd ?? listing.lastTradeUsd ?? null;
  const bestBid = orderBook?.bestBidUsd ?? orderBook?.bids[0]?.priceUsd ?? null;
  const bookKnown = orderBook != null;
  const bookEmpty = bookKnown && (orderBook?.bids?.length ?? 0) === 0 && bestBid == null;
  // Informational price guidance only — never feeds the quote or the order.
  const marketRef = selectMarketReference(bestBid, lastPrice);
  const guideDirection =
    validPriceCents == null ? null : priceGuidance(validPriceCents, marketRef);
  const marketGuide =
    guideDirection == null || marketRef == null
      ? null
      : { direction: guideDirection, refCents: marketRef };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy="sell-sheet-title"
      dismissible={!pending && !cancelOrder.isPending && step !== "success"}
    >
      {freeShares <= 0 ? (
        <div className="space-y-4 pb-2 text-center" data-testid="sell-empty">
          <h2 id="sell-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
            {t("sellNoPositionTitle")}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("sellNoPositionBody")}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="h-[48px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out"
          >
            {t("doneCta")}
          </button>
        </div>
      ) : mode === "instant" && step === "success" ? (
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
      ) : listed && listedOrder ? (
        <SellListingStatus
          order={listedOrder}
          book={orderBook}
          quote={quote}
          cancelling={cancelOrder.isPending}
          cancelError={cancelOrder.error instanceof Error ? cancelOrder.error.message : null}
          onCancel={cancelListing}
          onDone={onClose}
        />
      ) : (
        <div className="space-y-4 pb-2" data-testid="sell-sheet">
          <h2 id="sell-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
            {mode === "instant" && reviewing
              ? t("confirmInstantSale")
              : mode === "custom" && reviewing
                ? t("sellReviewTitle")
                : t("sellSheetTitle")}
          </h2>

          {mode === "instant" && reviewing ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("instantSellReviewBody")}
            </p>
          ) : null}
          {!reviewing ? (
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
          ) : null}

          {mode === "instant" ? (
            <SellInstantPane
              listingTitle={displayTitle}
              shares={shares}
              max={max}
              freeShares={freeShares}
              rangeError={rangeError}
              gross={gross}
              fee={fee}
              net={net}
              instantQuote={instantQuote}
              funding={funding}
              reviewing={reviewing}
              pending={instant.isPending}
              ctaDisabled={invalid || !funding || instant.isPending}
              error={instant.error as Error | null}
              onSharesChange={setShares}
              onReview={() => setStep("review")}
              onBack={() => setStep("form")}
              onConfirm={submitInstant}
            />
          ) : (
            <SellCustomPane
              listingTitle={displayTitle}
              totalShares={listing.totalShares}
              owned={owned}
              avgCostUsd={avgCostUsd}
              shares={shares}
              max={max}
              freeShares={freeShares}
              rangeError={rangeError}
              priceText={priceText}
              priceCents={validPriceCents}
              priceInvalid={issues.invalidPrice}
              quote={quote}
              bestBid={bestBid}
              lastPrice={lastPrice}
              marketGuide={marketGuide}
              bookEmpty={bookEmpty}
              funding={funding}
              reviewing={reviewing}
              pending={placeOrder.isPending}
              ctaDisabled={invalid || placeOrder.isPending}
              error={placeOrder.error as Error | null}
              onSharesChange={setShares}
              onPriceTextChange={setPriceText}
              onReview={() => setStep("review")}
              onBack={() => setStep("form")}
              onConfirm={submitCustom}
            />
          )}
        </div>
      )}
    </Sheet>
  );
}
