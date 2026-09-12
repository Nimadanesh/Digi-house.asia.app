// File responsibility: Estate tab investment thesis (PROMPT 05 desire) — the
// high-level V1 economic narrative without becoming a financial dashboard.
// ANR basis → modeled scenario revenue range → projected per-share economics,
// all from Financial Model V1 (the sole calculation authority). No legacy
// ADR/occupancy/cost/allocation figures; no Growth Potential here (it lives in
// the investment panel, never duplicated); UNKNOWN stays honest with the
// engine's stated reason. Detailed chain + disclaimers live on Income.
// DEC-014 (Layer 2): rows render through FactRow — ⓘ leads the label, the
// whole row opens the provenance sheet, figures are compact money (M/K) and
// never wrap, long captions clamp with Show more/less.
"use client";
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import { v1AnrToCents } from "@/lib/economics/financial-model-v1";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";

export function EstateV1Thesis({
  v1,
  onShowIncome,
}: {
  /** V1 model for this estate; null only without a V1 input (never legacy). */
  v1: FinancialModelV1PropertyModel | null;
  /** Funnel progression: Overview (desire) → Income (conviction). */
  onShowIncome: () => void;
}) {
  const t = useTranslations("property");
  if (v1 == null) return null;
  const anrCents = v1AnrToCents(v1.anr.valueMajor);
  const anrProvenance = v1.anr.provenance === "OBSERVED_DERIVED" ? "observed" : "estimated";
  const perShare = v1.perShare;

  return (
    <section className="space-y-2" data-testid="estate-v1-thesis">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("v1ThesisTitle")}
      </h2>
      <Block className="p-4">
        <div className="space-y-1">
          <FactRow
            label={t("v1ThesisAnr")}
            value={moneySmart(anrCents, v1.currency)}
            valueTestId="thesis-anr"
            provenance={anrProvenance}
            caption={t("v1ThesisAnrNote")}
            captionTestId="thesis-anr-note"
          />
          <FactRow
            label={t("v1ThesisRevenue")}
            value={`${moneySmart(v1.conservative.grossCents, v1.currency)} – ${moneySmart(v1.optimistic.grossCents, v1.currency)}`}
            valueTestId="thesis-revenue"
            provenance="calculated"
          />
          <FactRow
            label={t("v1ThesisPerShare")}
            value={
              perShare.annualCents != null
                ? `${moneySmart(perShare.annualCents, perShare.currency)} ${t("incomeV1PerYear")}`
                : unavailableLabel("backend_absent")
            }
            valueTestId="thesis-pershare"
            provenance={perShare.annualCents != null ? "projected" : "unknown"}
            valueMuted={perShare.annualCents == null}
            caption={
              perShare.annualCents == null && perShare.unknownReason
                ? perShare.unknownReason
                : t("v1ScenarioNote")
            }
          />
        </div>
        <button
          type="button"
          onClick={onShowIncome}
          className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
          data-testid="thesis-see-income"
        >
          {t("v1ThesisSeeIncome")}
        </button>
      </Block>
    </section>
  );
}
