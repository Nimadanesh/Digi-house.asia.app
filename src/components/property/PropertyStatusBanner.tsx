// File responsibility: full-width status banner — funding (amber) vs resale (green).
// Phase 9: "Live Trading" vocabulary removed — secondary surfaces read as ownership
// ("Resale market"), never a trading terminal.
// Final PO Decision 7: no "Fully funded" completion claim — the canonical supply has
// no canonical sales ledger, so funded/resale demo states both surface honestly as
// the resale market (numbers, when shown, are demo-ledger facts, never completion).
import { useTranslations } from "next-intl";
import { pct } from "@/lib/format";
import type { Listing } from "@/types/property";

export function PropertyStatusBanner({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const isPrimary = listing.status === "funding";

  if (isPrimary) {
    return (
      <div
        className="rounded-[10px] bg-warning/12 px-3 py-2 text-center text-[0.8125rem] font-semibold text-warning"
        data-testid="status-banner"
      >
        {t("bannerFunding", {
          progress: pct(listing.fundingProgressRatio),
          // Slice 8 (P2-3): grouped digits — matches the metrics grid below.
          count: listing.sharesRemaining.toLocaleString(),
          unit: listing.sharesRemaining === 1 ? t("shareWord") : t("sharesWord"),
        })}
      </div>
    );
  }

  return (
    <div
      className="rounded-[10px] bg-success/12 px-3 py-2 text-center text-[0.8125rem] font-semibold text-success"
      data-testid="status-banner"
    >
      {t("bannerResale")}
    </div>
  );
}
