// File responsibility: Estate tab rental-performance story (all-24 data
// completion) — a 3-line narrative from canonical data only: the observed
// nightly rental display (Rental Escapes fact, provenance on demand) →
// operating costs → net distributable income (both pending until operating
// reports exist — rendered via the unavailable vocabulary, never a fabricated
// number, never a mock annual-rent figure).
import { useTranslations } from "next-intl";
import { unavailableLabel } from "@/lib/availability";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

export function RentalStoryBlock({
  nightlyDisplay,
  onShowIncome,
}: {
  /** Canonical observed nightly display verbatim (rate semantics intact). */
  nightlyDisplay: string | null;
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
            <span className="text-sm text-muted-foreground">{t("rentalStoryNightlyRate")}</span>
            <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="rental-story-rent">
              {nightlyDisplay != null ? (
                <>
                  {/* Slice 7: bidi isolation for $-ranges in RTL locales. */}
                  <span dir="ltr" className="truncate text-sm tnum font-semibold text-foreground">
                    {nightlyDisplay}
                  </span>
                  <ProvenanceInfo provenance="observed" />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {unavailableLabel("backend_absent")}
                </span>
              )}
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
