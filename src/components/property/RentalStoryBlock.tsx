// File responsibility: Estate tab rental-economics story (Phase 9 UI Mapping §5.2 —
// "Estate tab — rental/income story"). A 3-line narrative from EXISTING data only:
// projected annual rent (AVAILABLE as a projection) → operating costs → net
// distributable income (both UNAVAILABLE — rendered via the Slice 1 unavailable
// vocabulary, never a fabricated number).
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { Listing } from "@/types/property";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";

export function RentalStoryBlock({
  listing,
  onShowIncome,
}: {
  listing: Listing;
  /** Switches to the Income tab (projections + income history live there). */
  onShowIncome: () => void;
}) {
  const t = useTranslations("property");
  const notReported = unavailableLabel("not_reported");

  return (
    <section className="space-y-2" data-testid="rental-story">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("rentalStoryTitle")}
      </h2>
      <Block className="p-4">
        <div className="space-y-3">
          <Row>
            <span className="text-sm text-muted-foreground">{t("rentalStoryProjectedRent")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="rental-story-rent">
              {usd(listing.annualRentUsd)}
              <span className="ml-1.5 text-xs font-medium text-muted-foreground">{t("projectedTag")}</span>
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("rentalStoryCosts")}</span>
            <span className="ml-auto text-sm text-muted-foreground" data-testid="rental-story-costs">
              {notReported}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("rentalStoryNetIncome")}</span>
            <span className="ml-auto text-sm text-muted-foreground" data-testid="rental-story-net">
              {notReported}
            </span>
          </Row>
        </div>
        <p className="pt-3 text-xs leading-relaxed text-muted-foreground">
          {t("rentalStoryNote")}
        </p>
        <button
          type="button"
          onClick={onShowIncome}
          className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
          data-testid="rental-story-see-income"
        >
          {t("rentalStorySeeIncome")}
        </button>
      </Block>
    </section>
  );
}
