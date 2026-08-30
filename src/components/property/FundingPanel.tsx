// File responsibility: Primary funding visualization (REDESIGN-SPEC §8) — calm premium
// progress: % funded headline, FundingBar (scaleX per DESIGN_SYSTEM), translated caption
// "X% funded · N shares remaining", and rows for sold/total, remaining, total target,
// fixed offer price. Primary only; no urgency, no FOMO, no fake scarcity.
import { useTranslations } from "next-intl";
import { pct, usd } from "@/lib/format";
import type { Listing } from "@/types/property";
import { offeredValueUsd } from "@/lib/property-yield";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { FundingBar } from "./FundingBar";

export function FundingPanel({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const tCommon = useTranslations("common");

  return (
    <section className="space-y-2" data-testid="funding-panel">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("salesProgress")}
      </h2>
      <Block className="space-y-4 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className="text-[1.625rem] font-bold leading-none tracking-tight text-foreground tnum"
            data-testid="funding-pct"
          >
            {pct(listing.fundingProgressRatio)}
          </span>
          <span className="text-xs text-muted-foreground tnum" data-testid="funding-caption">
            {t("fundedCaption", {
              pct: Math.round(listing.fundingProgressRatio * 100),
              remaining: listing.sharesRemaining,
            })}
          </span>
        </div>

        <FundingBar progress={listing.fundingProgressRatio} funded={listing.sharesRemaining <= 0} />

        <div>
          <Row>
            <span className="text-sm text-muted-foreground">{tCommon("shares")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="funding-sold-total"
            >
              {listing.sharesSold.toLocaleString()} / {listing.totalShares.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("sharesRemaining")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="funding-remaining"
            >
              {listing.sharesRemaining.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("totalTarget")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="funding-target"
            >
              {usd(offeredValueUsd(listing))}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("offerPrice")}</span>
            <span
              className="ml-auto text-sm tnum font-semibold text-foreground"
              data-testid="funding-price"
            >
              {usd(listing.sharePriceUsd)}
            </span>
          </Row>
        </div>
      </Block>
    </section>
  );
}
