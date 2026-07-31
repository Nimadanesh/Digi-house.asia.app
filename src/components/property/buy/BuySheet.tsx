"use client";
// File responsibility: Buy bottom-sheet shell — hosts qty / summary / success steps (Fable Buy Flow).
// Primary actions stay on Telegram MainButton (page-owned); this sheet is content only.
import type { Listing } from "@/types/property";
import type { BuyCurrency } from "@/types/buy";
import { Sheet } from "@/components/common/Sheet";
import { BuyQtyStep } from "./BuyQtyStep";
import { BuySummaryStep } from "./BuySummaryStep";
import { BuySuccessStep } from "./BuySuccessStep";

export type BuySheetStep = "qty" | "summary" | "success";

export function BuySheet({
  open,
  onClose,
  listing,
  step,
  qty,
  onQtyChange,
  walletConnected,
  currency,
  onCurrencyChange,
  usdtAvailable,
  buyError,
  buyPending,
  buyVerifying,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  step: BuySheetStep;
  qty: number;
  onQtyChange: (q: number) => void;
  walletConnected: boolean;
  currency: BuyCurrency;
  onCurrencyChange: (c: BuyCurrency) => void;
  /** False when the server reports USDT as not configured — disables the USDT option. */
  usdtAvailable?: boolean;
  buyError?: string | null;
  buyPending?: boolean;
  buyVerifying?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="buy-sheet-title">
      {step === "qty" ? (
        <BuyQtyStep
          listing={listing}
          qty={qty}
          onQtyChange={onQtyChange}
          walletConnected={walletConnected}
          currency={currency}
          onCurrencyChange={onCurrencyChange}
          usdtAvailable={usdtAvailable}
        />
      ) : null}
      {step === "summary" ? (
        <BuySummaryStep
          listing={listing}
          qty={qty}
          currency={currency}
          error={buyError}
          pending={buyPending}
          verifying={buyVerifying}
        />
      ) : null}
      {step === "success" ? (
        <BuySuccessStep propertyTitle={listing.title} qty={qty} onClose={onClose} />
      ) : null}
    </Sheet>
  );
}
