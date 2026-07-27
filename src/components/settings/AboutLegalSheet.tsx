"use client";
// File responsibility: nested About / Legal sheet — disclaimers once (MVP honesty).
import { Sheet } from "@/components/common/Sheet";
import { DEMO_TX_DISCLAIMER, PAYOUT_DISCLAIMER } from "@/lib/constants";

export function AboutLegalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} labelledBy="about-legal-title" className="max-h-[85svh] overflow-y-auto">
      <div className="space-y-4 pb-2" data-testid="about-legal-sheet">
        <h2 id="about-legal-title" className="text-[1.0625rem] font-semibold text-foreground">
          About / Legal
        </h2>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            DigiHouse is a Telegram Mini App for fractional real-estate shares on TON. Weekly rental
            yield is shown proportional to your ownership.
          </p>
          <p className="text-[0.6875rem] text-muted-foreground">{DEMO_TX_DISCLAIMER}</p>
          <p className="text-[0.6875rem] text-muted-foreground">{PAYOUT_DISCLAIMER}</p>
          <p>
            Nothing here is financial advice. Property documents and tokenization disclosures are
            for demonstration until production contracts ship.
          </p>
          <p className="text-xs text-muted-foreground">© DigiHouse · MVP</p>
        </div>
      </div>
    </Sheet>
  );
}
