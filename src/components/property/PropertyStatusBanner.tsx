// File responsibility: full-width status banner — funding (amber) vs live trading (green).
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
          count: listing.sharesRemaining,
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
      {t("bannerLiveTrading", { status: listing.status === "resale" ? t("resaleWord") : t("fullyFundedWord") })}
    </div>
  );
}
