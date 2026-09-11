// File responsibility: Estate tab investment-opportunity section (PROMPT 05) —
// connect V1 canonical fractionalization to the investor position: the Current
// Estimated Value ($8M single for Grand), Growth Potential ($18M, estimated,
// never ROI/profit), V1 total shares (valuation ÷ $100), the $100 nominal
// share price, ownership per share (1/N), and the $100 reference value per
// share (valuation ÷ V1 shares = NAV). Market/supply state lives in Resale +
// Ownership (never duplicated here); plans render an honest unconfigured note.
// No fixture totals/prices drive this panel when V1 exists; UNKNOWN stays honest.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { EstateShareOverview } from "@/types/estate-share";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";
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

  return (
    <section className="space-y-2" data-testid="estate-investment">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("investmentTitle")}
      </h2>
      <Block className="overflow-hidden">
        <div className="py-1">
          <Row>
            <span className="text-sm text-muted-foreground">{t("estateValue")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-estate-value">
              {display != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {formatValuationDisplayShort(display)}
                  </span>
                  <ProvenanceInfo provenance={display.provenance} />
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
          {growthPotential != null ? (
            <Row>
              <span className="text-sm text-muted-foreground">{t("growthPotentialTitle")}</span>
              <span
                className="ml-auto flex min-w-0 items-center gap-1.5"
                data-testid="investment-growth-potential"
              >
                <span className="truncate text-sm tnum font-semibold text-foreground">
                  {usd(growthPotential.potentialValue)}
                  {growthPct != null ? ` · ${growthPct}` : null}
                </span>
                <ProvenanceInfo provenance={growthPotential.provenance} />
              </span>
            </Row>
          ) : null}
          <Row>
            <span className="text-sm text-muted-foreground">{t("invTotalShares")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-total-shares">
              <span className="text-sm tnum font-semibold text-foreground">
                {totalShares.toLocaleString()}
              </span>
              {v1 != null ? <ProvenanceInfo provenance="calculated" /> : null}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invPricePerShare")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-primary-price">
              {v1 != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(V1_NOMINAL_SHARE_PRICE_CENTS)}
                  </span>
                  <ProvenanceInfo provenance="estimated" />
                </>
              ) : share.config.primarySharePrice != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(share.config.primarySharePrice)}
                  </span>
                  <ProvenanceInfo provenance="observed" />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{t("invPrimaryClosed")}</span>
              )}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invOwnershipPerShare")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-ownership-per-share">
              {/* Exact fraction: pct() would round 1/80000 to a misleading "0.0%". */}
              <span className="text-sm tnum font-semibold text-foreground">
                1 / {totalShares.toLocaleString()}
              </span>
              <ProvenanceInfo provenance="calculated" />
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invReferenceValue")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-reference-value">
              {referenceCents != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(referenceCents)}
                  </span>
                  <ProvenanceInfo provenance={referenceProvenance} />
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
        {growthPotential != null ? (
          <p className="px-4 pb-1 text-[0.6875rem] leading-relaxed text-muted-foreground" data-testid="investment-growth-note">
            {t("growthPotentialNote")}
          </p>
        ) : null}
        <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground" data-testid="investment-plans-note">
          {t("invPlansNote")}
        </p>
      </Block>
    </section>
  );
}
