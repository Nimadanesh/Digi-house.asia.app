"use client";
// File responsibility: Quantity stepper + total + live projected weekly yield. Connect-Wallet CTA
// when wallet disconnected (R-2.4). Confirm wired to onConfirm prop (Task 4 calls useBuyShares).
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { usd, ton, weeklyRent, projectedYield, estimateNanoTon } from "@/lib/format";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";
import type { Listing } from "@/types/property";
import { useTonConnect } from "@/hooks/useTonConnect";
import { WalletConnectButton } from "@/components/wallet/TonConnectButton";
import { WeeklyYieldCallout } from "./WeeklyYieldCallout";
import { cn } from "@/lib/utils";

export function BuyControl({ listing, onConfirm }: { listing: Listing; onConfirm?: (qty: number) => void }) {
  const tonc = useTonConnect();
  const [qty, setQty] = useState(1);
  const remaining = listing.sharesRemaining;
  const invalid = qty < 1 || qty > remaining;
  const totalUsd = qty * listing.sharePriceUsd;
  const weeklyPerShare = projectedYield(weeklyRent(listing.annualRentUsd), qty, listing.totalShares);

  if (!tonc.connected) {
    return (
      <div className="space-y-3">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">Buy shares</h2>
        <p className="text-sm text-muted-foreground">Connect a TON wallet to buy shares and receive weekly rental yield.</p>
        <WalletConnectButton />
      </div>
    );
  }

  // funding OR resale: sharesRemaining can be 0 in fully funded/resale. Hide buy when no primary shares left.
  if (remaining <= 0) {
    return (
      <div className="space-y-2">
        <h2 className="text-[0.9375rem] font-semibold text-foreground">Fully funded</h2>
        <p className="text-sm text-muted-foreground">All shares are owned. Resale order placement lands in Phase 4.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-[0.9375rem] font-semibold text-foreground">Buy shares</h2>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            aria-label="decrease quantity"
          >
            <Minus size={18} strokeWidth={1.75} />
          </button>
          <div className="min-w-[80px] text-center text-lg font-semibold tnum">{qty}</div>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(remaining, q + 1))}
            disabled={qty >= remaining}
            className="size-11 rounded-[10px] bg-surface-2 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-40"
            aria-label="increase quantity"
          >
            <Plus size={18} strokeWidth={1.75} />
          </button>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">{qty > remaining ? "Too many" : "remaining"}</div>
          <div className="text-sm tnum">{remaining}</div>
        </div>
      </div>
      {invalid ? (
        <p className="text-xs text-danger" role="alert">Quantity must be between 1 and {remaining}.</p>
      ) : null}
      <div className="space-y-1">
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="tnum font-medium">{usd(totalUsd)} · {ton(estimateNanoTon(totalUsd, TON_PRICE_USD_CENTS))}</span></div>
      </div>
      <WeeklyYieldCallout weeklyPerShare={weeklyPerShare} />
      {/* In-Page confirm button — Task 4 wires to MainButton. Disabled state intentional until wiring. */}
      <button
        type="button"
        disabled={invalid || !onConfirm}
        onClick={() => onConfirm?.(qty)}
        className={cn(
          "w-full h-[48px] rounded-[10px] font-semibold text-sm",
          invalid || !onConfirm ? "bg-secondary text-muted-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        {invalid ? "Enter a valid quantity" : `Buy ${qty} — ${usd(totalUsd)}`}
      </button>
    </div>
  );
}