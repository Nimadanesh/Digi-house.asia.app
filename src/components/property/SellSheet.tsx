"use client";
// File responsibility: Sell sheet on Property detail (PRODUCT-PLAN §0.3 / PC-06).
// Two modes per product spec: Instant (platform buys back at −7%, funding only) and
// Custom price (queued while the primary offering is open, live after sellout).
// Copy follows the buy-flow convention (English strings, like BuyQtyStep).
import { useState } from "react";
import { Minus, Plus, TrendingDown, Clock } from "lucide-react";
import type { Listing } from "@/types/property";
import { usd } from "@/lib/format";
import { INSTANT_SELL_FEE_BPS } from "@/types/sell";
import { haptics } from "@/lib/telegram/haptics";
import { useInstantSell, usePlaceOrder } from "@/hooks/useSells";
import { Sheet } from "@/components/common/Sheet";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

const MODES = [
  { value: "instant", label: "Instant" },
  { value: "custom", label: "Custom price" },
] as const;

type Mode = (typeof MODES)[number]["value"];

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
  const [mode, setMode] = useState<Mode>("instant");
  const [shares, setShares] = useState(1);
  // custom price: default to the user's cost, editable in whole dollars (cents input ×100)
  const [priceDollars, setPriceDollars] = useState(
    Math.round(avgCostUsd / 100) || Math.round(listing.sharePriceUsd / 100),
  );
  const instant = useInstantSell();
  const placeOrder = usePlaceOrder();

  const max = Math.max(1, freeShares);
  const invalid = shares < 1 || shares > freeShares;
  const funding = listing.status === "funding";

  const gross = shares * listing.sharePriceUsd;
  const fee = Math.floor((gross * INSTANT_SELL_FEE_BPS) / 10_000);
  const net = gross - fee;
  const customProceeds = shares * priceDollars * 100;

  function submit() {
    if (mode === "instant") {
      instant.mutate(
        { propertyId: listing.id, shares },
        { onSuccess: onClose },
      );
    } else {
      placeOrder.mutate(
        {
          propertyId: listing.id,
          side: "sell",
          priceUsd: priceDollars * 100,
          quantity: shares,
        },
        { onSuccess: onClose },
      );
    }
  }

  const pending = instant.isPending || placeOrder.isPending;
  const error = (instant.error ?? placeOrder.error) as Error | null;

  return (
    <Sheet open={open} onClose={onClose} labelledBy="sell-sheet-title">
      <div className="space-y-4 pb-2" data-testid="sell-sheet">
        <h2 id="sell-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
          Sell shares
        </h2>

        <div className="grid grid-cols-2 gap-2" role="group" aria-label="Sell mode">
          {MODES.map((m) => {
            const selected = mode === m.value;
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={selected}
                aria-label={`Sell ${m.label}`}
                onClick={() => {
                  haptics.selection();
                  setMode(m.value);
                }}
                className={`min-h-[44px] rounded-[12px] text-sm font-semibold transition-colors duration-[120ms] ease-out ${
                  selected
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-2 text-muted-foreground"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <Block>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Free shares</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground">{freeShares}</span>
          </Row>
          <Row className="!min-h-[48px]">
            <span className="text-sm text-muted-foreground">Locked / in orders</span>
            <span className="ml-auto text-sm tnum text-muted-foreground">not sellable</span>
          </Row>
        </Block>

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
          <div className="min-w-[88px] text-center text-3xl font-semibold tnum" data-testid="sell-qty">
            {shares}
          </div>
          <button
            type="button"
            aria-label="Increase quantity"
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
            Max
          </button>
        </div>
        {invalid ? (
          <p className="text-xs text-danger text-center" role="alert">
            Quantity must be between 1 and {freeShares}.
          </p>
        ) : null}

        {mode === "instant" ? (
          <>
            <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5" data-testid="instant-summary">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Value</span>
                <span className="tnum font-semibold text-foreground">{usd(gross)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fee (7%)</span>
                <span className="tnum font-medium text-danger">−{usd(fee)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-1.5">
                <span className="text-muted-foreground">You receive</span>
                <span className="tnum font-semibold text-success">{usd(net)}</span>
              </div>
            </div>
            {!funding ? (
              <p className="text-xs text-danger text-center" role="alert">
                Instant sell ended — the primary offering is sold out. Use a custom price.
              </p>
            ) : null}
            <button
              type="button"
              disabled={invalid || !funding || pending}
              onClick={submit}
              className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="instant-sell-confirm"
            >
              {pending ? "Selling…" : `Sell instantly · ${usd(net)}`}
            </button>
            <p className="text-[0.6875rem] text-center text-muted-foreground">
              <TrendingDown size={12} strokeWidth={1.75} className="inline me-1 -mt-0.5" aria-hidden />
              Platform buys back at list price − 7%. Credited to your investing balance.
            </p>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="sell-price" className="text-sm text-muted-foreground">
                Price per share
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
                <span className="text-muted-foreground">Order value</span>
                <span className="tnum font-semibold text-foreground">{usd(customProceeds)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Market fee</span>
                <span className="tnum font-medium text-muted-foreground">on trade</span>
              </div>
            </div>
            {funding ? (
              <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
                <Clock size={12} strokeWidth={1.75} className="inline me-1 -mt-0.5" aria-hidden />
                Queued until the primary offering sells out — then your order goes live on
                the market automatically.
              </p>
            ) : null}
            <button
              type="button"
              disabled={invalid || pending}
              onClick={submit}
              className="h-[52px] w-full rounded-[12px] bg-primary text-[0.9375rem] font-semibold text-primary-foreground active:scale-[0.98] transition-transform duration-[120ms] ease-out disabled:opacity-40"
              data-testid="custom-sell-confirm"
            >
              {pending ? "Placing…" : funding ? "Queue sell order" : "Place sell order"}
            </button>
          </>
        )}

        {error ? (
          <p className="text-xs text-danger text-center" role="alert">
            {error.message}
          </p>
        ) : null}
      </div>
    </Sheet>
  );
}
