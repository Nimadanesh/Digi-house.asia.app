// File responsibility: funding progress + scarcity line (Fable §Sales progress).
import { pct } from "@/lib/format";
import type { Listing } from "@/types/property";
import { FundingBar } from "./FundingBar";

export function SalesProgress({ listing }: { listing: Listing }) {
  const funded = listing.fundingProgressRatio >= 1;
  const remaining = listing.sharesRemaining;
  return (
    <div className="space-y-2" data-testid="sales-progress">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {funded ? "Fully funded" : "Sales progress"}
        </span>
        <span className="text-xs text-foreground tnum">{pct(listing.fundingProgressRatio)}</span>
      </div>
      <FundingBar progress={listing.fundingProgressRatio} funded={funded} />
      {!funded && remaining > 0 ? (
        <p className="text-sm text-foreground font-medium">
          Only <span className="tnum text-primary">{remaining}</span>{" "}
          {remaining === 1 ? "share" : "shares"} left
        </p>
      ) : null}
    </div>
  );
}
