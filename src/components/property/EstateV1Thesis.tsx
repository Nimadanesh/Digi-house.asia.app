// File responsibility: Estate tab investment thesis (PROMPT 05 desire) — the
// high-level V1 economic narrative without becoming a financial dashboard.
// ANR basis → modeled scenario revenue range → projected per-share economics,
// all from Financial Model V1 (the sole calculation authority). No legacy
// ADR/occupancy/cost/allocation figures; no Growth Potential here (it lives in
// the investment panel, never duplicated); UNKNOWN stays honest with the
// engine's stated reason. Detailed chain + disclaimers live on Income.
"use client";
import { useTranslations } from "next-intl";
import { eur, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import { v1AnrToCents } from "@/lib/economics/financial-model-v1";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

function money(cents: number, currency: "USD" | "EUR"): string {
  return currency === "EUR" ? eur(cents) : usd(cents);
}

export function EstateV1Thesis({
  v1,
  onShowIncome,
}: {
  /** V1 model for this estate; null only without a V1 input (never legacy). */
  v1: FinancialModelV1PropertyModel | null;
  /** Funnel progression: Estate (desire) → Income (conviction). */
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
        <div className="space-y-3">
          <Row>
            <span className="text-sm text-muted-foreground">{t("v1ThesisAnr")}</span>
            <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="thesis-anr">
              <span className="truncate text-sm tnum font-semibold text-foreground">
                {money(anrCents, v1.currency)}
              </span>
              <ProvenanceInfo provenance={anrProvenance} />
            </span>
          </Row>
          {/* Slice 6: the ANR can exceed the card's from-range (it averages every
              listed rate for projections) — one plain-language line prevents the
              stall. Methodology stays on Income; nothing technical here. */}
          <p
            className="-mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground"
            data-testid="thesis-anr-note"
          >
            {t("v1ThesisAnrNote")}
          </p>
          <Row>
            <span className="shrink-0 text-sm text-muted-foreground">{t("v1ThesisRevenue")}</span>
            <span className="ml-auto flex min-w-0 items-center justify-end gap-1.5 text-right" data-testid="thesis-revenue">
              <span className="text-sm tnum font-semibold break-words text-foreground">
                {money(v1.conservative.grossCents, v1.currency)} –{" "}
                {money(v1.optimistic.grossCents, v1.currency)}
              </span>
              <ProvenanceInfo provenance="calculated" />
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("v1ThesisPerShare")}</span>
            <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="thesis-pershare">
              {perShare.annualCents != null ? (
                <>
                  <span className="truncate text-sm tnum font-semibold text-foreground">
                    {money(perShare.annualCents, perShare.currency)} {t("incomeV1PerYear")}
                  </span>
                  <ProvenanceInfo provenance="projected" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {unavailableLabel("backend_absent")}
                  </span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
        </div>
        {perShare.annualCents == null && perShare.unknownReason ? (
          <p className="pt-3 text-xs leading-relaxed text-muted-foreground" data-testid="thesis-unknown-note">
            {perShare.unknownReason}
          </p>
        ) : (
          <p className="pt-3 text-xs leading-relaxed text-muted-foreground">{t("v1ScenarioNote")}</p>
        )}
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
