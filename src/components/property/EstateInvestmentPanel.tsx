// File responsibility: Estate tab investment-opportunity section (contract §6F) —
// connect estate economics to the investor position from the ShareModel overview:
// supply, the three DISTINCT prices (primary / reference / secondary), ownership
// per share, and availability. Plans render an honest unconfigured note (no plan
// presets exist in the repo — product decision pending). No invented supply.
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { EstateShareOverview } from "@/types/estate-share";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";
import type { Provenance } from "@/types/estate";
import {
  formatGrowthPct,
  formatValuationDisplay,
  type GrowthPotential,
  type ValuationDisplay,
} from "@/lib/economics/estates/growth-potential";

export function EstateInvestmentPanel({
  share,
  estateValue,
  estateValueDisplay,
  growthPotential,
}: {
  share: EstateShareOverview;
  /**
   * Canonical total estate value (minor units) with provenance — Slice E §6F.
   * Shown ONLY when the canonical model provides it; otherwise the row renders
   * the honest unavailable state (legacy mock figures are never revived here).
   */
  estateValue?: { value: number; provenance: Provenance } | null;
  /**
   * Current Estimated Value for DISPLAY (PROMPT 03 §4–§5) — Grand 2 BDM
   * renders the approved $8M–$10M range. Preferred over `estateValue` when
   * provided; both are null only without a canonical record.
   */
  estateValueDisplay?: ValuationDisplay | null;
  /**
   * Growth Potential (PROMPT 03 §4–§6) — the upper end of the researched
   * valuation range (estimated, never a forecast or promise). Grand 2 BDM →
   * $18M with no percentage (current is a range). Null when unavailable.
   * Never mixed with rental income or market figures.
   */
  growthPotential?: GrowthPotential | null;
}) {
  const t = useTranslations("property");
  const { config, structure, state } = share;
  // Display resolution: the range-aware PROMPT 03 value wins; the legacy
  // single-value prop stays as the fallback for callers without a view-model.
  const display: ValuationDisplay | null =
    estateValueDisplay ??
    (estateValue != null
      ? { kind: "single", value: estateValue.value, provenance: estateValue.provenance }
      : null);
  const growthPct = formatGrowthPct(growthPotential?.potentialPct ?? null);

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
                    {formatValuationDisplay(display)}
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
              </span>
            </Row>
          ) : null}
          <Row>
            <span className="text-sm text-muted-foreground">{t("invTotalShares")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="investment-total-shares">
              {config.totalShares.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invPricePerShare")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-primary-price">
              {config.primarySharePrice != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(config.primarySharePrice)}
                  </span>
                  <ProvenanceInfo provenance="observed" />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{t("invPrimaryClosed")}</span>
              )}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invAvailable")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="investment-available">
              {config.primarySharesAvailable.toLocaleString()}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invOwnershipPerShare")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-ownership-per-share">
              {structure.ownershipPerShare != null ? (
                <>
                  {/* Exact fraction: pct() would round 1/2500 to a misleading "0.0%". */}
                  <span className="text-sm tnum font-semibold text-foreground">
                    1 / {config.totalShares.toLocaleString()}
                  </span>
                  <ProvenanceInfo provenance="calculated" />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {unavailableLabel("backend_absent")}
                </span>
              )}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">{t("invReferenceValue")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-reference-value">
              {structure.referenceAssetValuePerShare != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(structure.referenceAssetValuePerShare.value)}
                  </span>
                  <ProvenanceInfo provenance={structure.referenceAssetValuePerShare.provenance} />
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
          <Row>
            <span className="text-sm text-muted-foreground">{t("invSecondaryPrice")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="investment-secondary-price">
              {share.secondaryMarketPrice != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(share.secondaryMarketPrice.value)}
                  </span>
                  <ProvenanceInfo provenance={share.secondaryMarketPrice.provenance} />
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {state.secondaryAvailableListings > 1
                    ? t("invSecondaryUnknown")
                    : unavailableLabel("backend_absent")}
                </span>
              )}
            </span>
          </Row>
          {share.lowestActiveAskUsd != null ? (
            <Row>
              <span className="text-sm text-muted-foreground">{t("invLowestAsk")}</span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="investment-lowest-ask">
                <span className="text-sm tnum font-semibold text-foreground">
                  {usd(share.lowestActiveAskUsd)}
                </span>
                <ProvenanceInfo provenance="observed" />
              </span>
            </Row>
          ) : null}
        </div>
        <p className="border-t border-border px-4 py-3 text-xs leading-relaxed text-muted-foreground" data-testid="investment-plans-note">
          {t("invPlansNote")}
        </p>
      </Block>
    </section>
  );
}
