// File responsibility: Estate tab investment-opportunity section (PROMPT 05) —
// connect V1 canonical fractionalization to the investor position: the Current
// Estimated Value ($8M single for Grand), Growth Potential ($18M, estimated,
// never ROI/profit), V1 total shares (valuation ÷ $100), the $100 nominal
// share price, ownership per share (1/N), and the $100 reference value per
// share (valuation ÷ V1 shares = NAV). Market/supply state lives in Resale +
// Ownership (never duplicated here); plans render an honest unconfigured note.
// No fixture totals/prices drive this panel when V1 exists; UNKNOWN stays honest.
// DEC-014 (Layer 2): FactRow rows — ⓘ leads the label, the whole row opens the
// provenance sheet, figures are compact money (M/K) and never wrap.
import { useTranslations } from "next-intl";
import { moneyCompact, moneySmart, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { EstateShareOverview } from "@/types/estate-share";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";
import type { Provenance } from "@/types/estate";
import {
  formatGrowthPct,
  formatValuationDisplayShort,
  type GrowthPotential,
  type ValuationDisplay,
} from "@/lib/economics/estates/growth-potential";
import { V1_NOMINAL_SHARE_PRICE_CENTS } from "./OwnershipV1Panel";

export function EstateInvestmentPanel({
  share,
  estateValue,
  estateValueDisplay,
  growthPotential,
  v1,
}: {
  share: EstateShareOverview;
  /**
   * Canonical total estate value (minor units) with provenance — Slice E §6F.
   * Shown ONLY when the canonical model provides it; otherwise the row renders
   * the honest unavailable state (legacy mock figures are never revived here).
   */
  estateValue?: { value: number; provenance: Provenance } | null;
  /**
   * Current Estimated Value for DISPLAY (PROMPT 05): Grand 2 BDM renders the
   * approved $8M single value (V1 canonical). Preferred over `estateValue`
   * when provided; both are null only without a canonical record.
   */
  estateValueDisplay?: ValuationDisplay | null;
  /**
   * Growth Potential (PROMPT 03 §4–§6, PROMPT 05 §9) — the upper end of the
   * researched valuation range (estimated, never a forecast or promise).
   * Grand 2 BDM → $18M with no percentage. Null when unavailable.
   * Never mixed with rental income or market figures.
   */
  growthPotential?: GrowthPotential | null;
  /**
   * Financial Model V1 evaluation (PROMPT 05 sole authority). When present,
   * fractionalization rows use V1 (total = valuation ÷ $100, nominal $100,
   * reference $100); fixture trading counts never drive these rows.
   */
  v1?: FinancialModelV1PropertyModel | null;
}) {
  const t = useTranslations("property");
  // Display resolution: the range-aware PROMPT 03 value wins; the legacy
  // single-value prop stays as the fallback for callers without a view-model.
  const display: ValuationDisplay | null =
    estateValueDisplay ??
    (estateValue != null
      ? { kind: "single", value: estateValue.value, provenance: estateValue.provenance }
      : null);
  const growthPct = formatGrowthPct(growthPotential?.potentialPct ?? null);
  // V1 fractionalization wins whenever the model exists (all 24 estates);
  // fixture counts survive only as the fallback for unknown ids (never the 24).
  const totalShares = v1?.totalShares ?? share.config.totalShares;
  const referenceCents =
    v1 != null ? v1.valuation.valueCents / v1.totalShares : share.structure.referenceAssetValuePerShare?.value ?? null;
  const referenceProvenance =
    v1 != null ? ("calculated" as const) : (share.structure.referenceAssetValuePerShare?.provenance ?? "unknown");
  const v1Currency = v1?.currency ?? "USD";

  return (
    <section className="space-y-2" data-testid="estate-investment">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("investmentTitle")}
      </h2>
      <Block className="overflow-hidden">
        <div className="py-1">
          <FactRow
            label={t("estateValue")}
            value={
              display != null
                ? formatValuationDisplayShort(display)
                : unavailableLabel("backend_absent")
            }
            valueTestId="investment-estate-value"
            provenance={display?.provenance ?? "unknown"}
            valueMuted={display == null}
          />
          {growthPotential != null ? (
            <FactRow
              label={t("growthPotentialTitle")}
              value={`${moneyCompact(growthPotential.potentialValue, "USD")}${growthPct != null ? ` · ${growthPct}` : ""}`}
              valueTestId="investment-growth-potential"
              provenance={growthPotential.provenance}
              caption={t("growthPotentialNote")}
            />
          ) : null}
          <FactRow
            label={t("invTotalShares")}
            value={totalShares.toLocaleString()}
            valueTestId="investment-total-shares"
            provenance={v1 != null ? "calculated" : null}
          />
          <FactRow
            label={t("invPricePerShare")}
            value={
              v1 != null
                ? usd(V1_NOMINAL_SHARE_PRICE_CENTS)
                : share.config.primarySharePrice != null
                  ? usd(share.config.primarySharePrice)
                  : t("invPrimaryClosed")
            }
            valueTestId="investment-primary-price"
            provenance={
              v1 != null ? "estimated" : share.config.primarySharePrice != null ? "observed" : "unknown"
            }
            valueMuted={v1 == null && share.config.primarySharePrice == null}
          />
          <FactRow
            label={t("invOwnershipPerShare")}
            // Exact fraction: pct() would round 1/80000 to a misleading "0.0%".
            value={`1 / ${totalShares.toLocaleString()}`}
            valueTestId="investment-ownership-per-share"
            provenance="calculated"
          />
          <FactRow
            label={t("invReferenceValue")}
            value={
              referenceCents != null
                ? moneySmart(referenceCents, v1Currency)
                : unavailableLabel("backend_absent")
            }
            valueTestId="investment-reference-value"
            provenance={referenceProvenance}
            valueMuted={referenceCents == null}
          />
        </div>
        <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground" data-testid="investment-plans-note">
          {t("invPlansNote")}
        </p>
      </Block>
    </section>
  );
}
