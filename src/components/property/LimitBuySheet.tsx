"use client";
// File responsibility: limit buy form on the secondary market (PD-06). Copy follows the
// buy/sell-sheet convention (English strings, like BuyQtyStep / SellSheet). A live buy
// order escrows notional + market fee from the investing balance at placement (PD-01).
import { useState } from "react";
import { Minus, Plus, Lock } from "lucide-react";
import type { Listing } from "@/types/property";
import type { OrderBookState } from "@/types/order";
import { usd } from "@/lib/format";
import { previewFeeUsd, bpsToPct } from "@/types/fees";
import { haptics } from "@/lib/telegram/haptics";
import { useFees } from "@/hooks/useFees";
import { usePlaceOrder } from "@/hooks/useSells";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function LimitBuySheet({
  open,
  onClose,
  listing,
  orderBook,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  orderBook?: OrderBookState;
}) {
  const reference =
    orderBook?.bestAskUsd ?? orderBook?.lastTradeUsd ?? listing.sharePriceUsd;
  const [priceDollars, setPriceDollars] = useState(
    Math.max(1, Math.round(reference / 100)),
  );
  const [shares, setShares] = useState(1);
  const fees = useFees();
  const placeOrder = usePlaceOrder();

  const notional = shares * priceDollars * 100;
  const tier = fees.data?.find(
    (t) =>
      notional >= t.minAmountUsd &&
      (t.maxAmountUsd == null || notional <= t.maxAmountUsd),
  );
  const fee = previewFeeUsd(fees.data ?? [], notional, "buy_secondary");
  const total = notional + (fee ?? 0);

  const invalid = shares < 1 || priceDollars < 1;

  function submit() {
    if (invalid || placeOrder.isPending) return;
    placeOrder.mutate(
      {
        propertyId: listing.id,
        side: "buy",
        priceUsd: priceDollars * 100,
        quantity: shares,
      },
      { onSuccess: onClose },
    );
  }

  const pending = placeOrder.isPending;
  const error = placeOrder.error as Error | null;

  return (
    <Sheet open={open} onClose={onClose} labelledBy="limit-buy-title">
      <div className="space-y-4 pb-2" data-testid="limit-buy-sheet">
        <h2 id="limit-buy-title" className="text-[1.0625rem] font-semibold text-foreground">
          Buy on market
        </h2>

        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Best ask</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">
              {orderBook?.bestAskUsd ? usd(orderBook.bestAskUsd) : "—"}
            </span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Last price</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">
              {orderBook?.lastTradeUsd ? usd(orderBook.lastTradeUsd) : "—"}
            </span>
          </Row>
        </Block>

        <div className="space-y-2">
          <label htmlFor="limit-buy-price" className="text-sm text-muted-foreground">
            Price per share
          </label>
          <div className="flex items-center gap-2 rounded-[12px] bg-surface-2 px-3">
            <span className="text-sm font-semibold text-muted-foreground">$</span>
            <input
              id="limit-buy-price"
              type="number"
              min={1}
              step={1}
              value={priceDollars}
              onChange={(e) => setPriceDollars(Math.max(1, Number(e.target.value) || 1))}
              className="min-h-[48px] w-full bg-transparent text-lg font-semibold tnum text-foreground outline-none"
              data-testid="limit-buy-price-input"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={shares <= 1}
            onClick={() => {
              haptics.selection();
              setShares((q) => Math.max(1, q - 1));
            }}
            className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            <Minus size={22} strokeWidth={1.75} />
          </button>
          <div className="min-w-[88px] text-center text-3xl font-semibold tnum" data-testid="limit-buy-qty">
            {shares}
          </div>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => {
              haptics.selection();
              setShares((q) => q + 1);
            }}
            className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            <Plus size={22} strokeWidth={1.75} />
          </button>
        </div>

        <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5" data-testid="limit-buy-summary">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order value</span>
            <span className="tnum font-semibold text-foreground">{usd(notional)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Market fee{tier ? ` (${bpsToPct(tier.buySecondaryBps)})` : ""}
            </span>
            <span className="tnum font-medium text-muted-foreground">{fee == null ? "—" : usd(fee)}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-border pt-1.5">
            <span className="text-muted-foreground">Held in escrow</span>
            <span className="tnum font-semibold text-foreground">{fee == null ? "—" : usd(total)}</span>
          </div>
        </div>

        <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
          <Lock size={12} strokeWidth={1.75} className="inline me-1 -mt-0.5" aria-hidden />
          Funds are held from your investing balance until the order fills — or you cancel it.
        </p>

        {error ? (
          <p className="text-xs text-danger text-center" role="alert">
            {error.message}
          </p>
        ) : null}

        <button
          type="button"
          disabled={invalid || pending}
          onClick={submit}
          className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          data-testid="limit-buy-confirm"
        >
          {pending ? "Placing…" : fee == null ? "Place buy order" : `Place buy order · ${usd(total)}`}
        </button>
      </div>
    </Sheet>
  );
}
