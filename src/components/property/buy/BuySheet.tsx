"use client";
// File responsibility: Buy bottom-sheet shell — hosts qty / summary / success steps (Fable Buy Flow).
// Primary actions stay on Telegram MainButton (page-owned); this sheet is content only.
import type { Listing } from "@/types/property";
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
  buyError,
  buyPending,
}: {
  open: boolean;
  onClose: () => void;
  listing: Listing;
  step: BuySheetStep;
  qty: number;
  onQtyChange: (q: number) => void;
  walletConnected: boolean;
  buyError?: string | null;
  buyPending?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="buy-sheet-title">
      {step === "qty" ? (
        <BuyQtyStep
          listing={listing}
          qty={qty}
          onQtyChange={onQtyChange}
          walletConnected={walletConnected}
        />
      ) : null}
      {step === "summary" ? (
        <BuySummaryStep listing={listing} qty={qty} error={buyError} pending={buyPending} />
      ) : null}
      {step === "success" ? (
        <BuySuccessStep propertyTitle={listing.title} qty={qty} onClose={onClose} />
      ) : null}
    </Sheet>
  );
}
