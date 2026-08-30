// File responsibility: property fundamentals (REDESIGN-SPEC §8) — existing listing data
// only: property value, annual rent, gross yield (annualRentUsd ÷ totalValueUsd).
// Metrics with no backing data are omitted, never fabricated (spec §8 rule).
import { useTranslations } from "next-intl";
import { usd, pct, annualYieldRatio } from "@/lib/format";
import type { Listing } from "@/types/property";
import { totalValueUsd } from "@/lib/property-yield";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function PropertyFundamentals({ listing }: { listing: Listing }) {
  const t = useTranslations("property");
  const value = totalValueUsd(listing);
  const grossYield = annualYieldRatio(listing.annualRentUsd, value);

  return (
    <section className="space-y-2" data-testid="property-fundamentals">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("fundamentals")}
      </h2>
      <Block>
        <Row>
          <span className="text-sm text-muted-foreground">{t("propertyValue")}</span>
          <span
            className="ml-auto text-sm tnum font-semibold text-foreground"
            data-testid="fundamentals-value"
          >
            {usd(value)}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("annualRent")}</span>
          <span
            className="ml-auto text-sm tnum font-semibold text-foreground"
            data-testid="fundamentals-rent"
          >
            {usd(listing.annualRentUsd)}
          </span>
        </Row>
        <Row>
          <span className="text-sm text-muted-foreground">{t("grossYield")}</span>
          <span
            className="ml-auto text-sm tnum font-semibold text-success"
            data-testid="fundamentals-gross-yield"
          >
            {pct(grossYield)}
          </span>
        </Row>
      </Block>
    </section>
  );
}
