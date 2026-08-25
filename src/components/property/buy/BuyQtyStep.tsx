"use client";
// File responsibility: Quantity step of Buy sheet — currency selector, balance, available shares,
// qty steppers + live total (shown in the selected rail).
import { Minus, Plus } from "lucide-react";
import { usd, ton, estimateNanoTon } from "@/lib/format";
import { positionYieldUsd } from "@/lib/property-yield";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { Listing } from "@/types/property";
import type { BuyCurrency } from "@/types/buy";
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { haptics } from "@/lib/telegram/haptics";
import { useTonConnect } from "@/hooks/useTonConnect";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

const QUICK = [10, 25, 50] as const;
const PAY_CURRENCIES: Array<{ value: BuyCurrency; label: string }> = [
  { value: "TON", label: "TON" },
  { value: "USDT", label: "USDT" },
];

export function BuyQtyStep({
  listing,
  qty,
  onQtyChange,
  walletConnected,
  currency,
  onCurrencyChange,
  usdtAvailable = true,
  unitPriceUsd,
}: {
  listing: Listing;
  qty: number;
  onQtyChange: (q: number) => void;
  walletConnected: boolean;
  currency: BuyCurrency;
  onCurrencyChange: (c: BuyCurrency) => void;
  /** False when the server reports USDT as not configured — the USDT option is disabled. */
  usdtAvailable?: boolean;
  /** Single source of truth (lib/property-price); defaults to list price. */
  unitPriceUsd?: number;
}) {
  const tonc = useTonConnect();
  const remaining = listing.sharesRemaining;
  const max = remaining;
  const unitPrice = unitPriceUsd ?? listing.sharePriceUsd;
  const totalUsd = qty * unitPrice;
  const weekly = positionYieldUsd(listing, qty).weeklyUsd;
  const invalid = qty < 1 || qty > remaining;

  function setQty(next: number) {
    haptics.selection();
    onQtyChange(next);
  }

  if (!walletConnected) {
    return (
      <div className="space-y-3.5 pb-2" data-testid="buy-qty-step">
        <div className="space-y-1.5">
          <h2 id="buy-sheet-title" className="text-[1.0625rem] font-semibold leading-snug text-foreground">
            Connect wallet
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground pb-0.5">
            Connect a TON wallet to buy shares and receive weekly rental yield.
          </p>
        </div>
        <WalletConnectButton className="w-full" />
      </div>
    );
  }

  if (remaining <= 0) {
    return (
      <div className="space-y-1.5 pb-2" data-testid="buy-qty-step">
        <h2 id="buy-sheet-title" className="text-[1.0625rem] font-semibold leading-snug text-foreground">
          Fully funded
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground pb-0.5">
          All primary shares are sold. Resale lands next.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-2" data-testid="buy-qty-step">
      <h2 id="buy-sheet-title" className="text-[1.0625rem] font-semibold text-foreground">
        Buy shares
      </h2>

      <div className="grid grid-cols-2 gap-2" role="group" aria-label="Payment currency">
        {PAY_CURRENCIES.map((opt) => {
          const selected = currency === opt.value;
          const disabled = opt.value === "USDT" && !usdtAvailable;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-label={`Pay with ${opt.value}`}
              onClick={() => {
                haptics.selection();
                onCurrencyChange(opt.value);
              }}
              className={`min-h-[44px] rounded-[12px] text-sm font-semibold transition-colors duration-[120ms] ease-out disabled:opacity-40 ${
                selected
                  ? "bg-primary/15 text-primary"
                  : "bg-surface-2 text-muted-foreground"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {!usdtAvailable ? (
        <p
          className="text-[0.6875rem] leading-relaxed text-muted-foreground"
          data-testid="usdt-unavailable-note"
        >
          USDT isn&apos;t available right now — you&apos;ll pay with TON.
        </p>
      ) : null}

      <Block>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">Wallet</span>
          <span className="ml-auto text-sm tnum text-foreground">{tonc.short || "Connected"}</span>
        </Row>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">Wallet balance</span>
          <span className="ml-auto text-sm tnum text-muted-foreground" data-testid="buy-wallet-balance">
            — · shown when chain linked
          </span>
        </Row>
        <Row className="!min-h-[48px]">
          <span className="text-sm text-muted-foreground">Available shares</span>
          <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="buy-available">
            {remaining}
          </span>
        </Row>
      </Block>

      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={qty <= 1}
          onClick={() => setQty(Math.max(1, qty - 1))}
          className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        >
          <Minus size={22} strokeWidth={1.75} />
        </button>
        <div className="min-w-[88px] text-center text-3xl font-semibold tnum" data-testid="buy-qty">
          {qty}
        </div>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={qty >= max}
          onClick={() => setQty(Math.min(max, qty + 1))}
          className="size-12 rounded-[12px] bg-surface-2 flex items-center justify-center active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
        >
          <Plus size={22} strokeWidth={1.75} />
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {QUICK.map((n) => (
          <button
            key={n}
            type="button"
            disabled={n > max}
            onClick={() => setQty(Math.min(max, n))}
            className="min-h-[44px] min-w-[52px] rounded-full bg-surface-2 px-3 text-sm font-medium text-foreground active:scale-[0.97] transition-transform duration-[120ms] ease-out disabled:opacity-40"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setQty(max)}
          className="min-h-[44px] min-w-[52px] rounded-full bg-primary/15 px-3 text-sm font-semibold text-primary active:scale-[0.97] transition-transform duration-[120ms] ease-out"
        >
          Max
        </button>
      </div>
      {invalid ? (
        <p className="text-xs text-danger text-center" role="alert">
          Quantity must be between 1 and {remaining}.
        </p>
      ) : null}
      <div className="rounded-[12px] bg-surface-2 p-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="tnum font-semibold text-foreground" data-testid="buy-qty-total">
            {currency === "USDT" ? `${usd(totalUsd)} USDT` : `${usd(totalUsd)} · ${ton(estimateNanoTon(totalUsd, TON_PRICE_USD_CENTS))}`}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Est. weekly yield</span>
          <span className="tnum font-medium text-success">{usd(weekly)}</span>
        </div>
      </div>
      <p className="text-[0.6875rem] text-center text-muted-foreground">
        Paid in {currency} from your connected wallet.
      </p>
    </div>
  );
}
