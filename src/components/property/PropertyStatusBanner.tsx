// File responsibility: full-width status banner — funding (amber) vs live trading (green).
import { pct } from "@/lib/format";
import type { Listing } from "@/types/property";

export function PropertyStatusBanner({ listing }: { listing: Listing }) {
  const isPrimary = listing.status === "funding";

  if (isPrimary) {
    return (
      <div
        className="rounded-[10px] bg-warning/12 px-3 py-2 text-center text-[0.8125rem] font-semibold text-warning"
        data-testid="status-banner"
      >
        Open for Funding · {pct(listing.fundingProgressRatio)} ·{" "}
        <span className="tnum">{listing.sharesRemaining}</span>{" "}
        {listing.sharesRemaining === 1 ? "share" : "shares"} left
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px] bg-success/12 px-3 py-2 text-center text-[0.8125rem] font-semibold text-success"
      data-testid="status-banner"
    >
      {listing.status === "resale" ? "Resale" : "Fully Funded"} · Live Trading
    </div>
  );
}
