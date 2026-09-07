// File responsibility: Estate tab rental-performance + money-chain sections
// (contract §6B–C). Presents ONE selected scenario evaluation from the canonical
// engines: nightly range → ADR → occupancy → gross revenue, then the
// ADR × Occupancy → Gross Revenue chain head. Values + provenance only —
// no engine imports, no formulas (all numbers arrive via props).
import { useTranslations } from "next-intl";
import { pct, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { ScenarioBound, SelectedScenario } from "@/lib/economics/estate-detail-view-model";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

function MetricRow({
  label,
  children,
  testid,
}: {
  label: string;
  children: React.ReactNode;
  testid: string;
}) {
  return (
    <Row>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="ml-auto flex items-center gap-1.5 text-sm tnum font-semibold text-foreground" data-testid={testid}>
        {children}
      </span>
    </Row>
  );
}

export function EstateEconomicsSection({
  nightlyRangeCents,
  nightlyFallbackText,
  selected,
  envelopeRangeCents,
  bound,
  onBoundChange,
}: {
  /** Canonical nightly range (minor units); null when no canonical estate. */
  nightlyRangeCents: { min: number; max: number } | null;
  /** Legacy display rate shown only when no canonical range exists. */
  nightlyFallbackText?: string | null;
  /**
   * Selected scenario evaluation; null → pending rows with the missing input
   * named. The bound tabs always render (all 24 estates share one structure).
   */
  selected: SelectedScenario | null;
  /** Gross-revenue envelope across occupancy bounds (minor units). */
  envelopeRangeCents: { lower: number; upper: number } | null;
  bound: ScenarioBound;
  onBoundChange: (bound: ScenarioBound) => void;
}) {
  const t = useTranslations("property");

  return (
    <section className="space-y-2" data-testid="estate-economics">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("economicsTitle")}
      </h2>
      <Block className="overflow-hidden">
        {/* Bound tabs render for every estate (shared structure); without an
            evaluation the rows below stay pending instead of hiding the tabs. */}
        <div className="flex gap-2 px-4 pt-3" data-testid="scenario-pills">
          {(
            [
              { id: "lower", label: t("scenarioLower") },
              { id: "base", label: t("scenarioBase") },
              { id: "upper", label: t("scenarioUpper") },
            ] as const
          ).map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => onBoundChange(pill.id)}
              aria-pressed={bound === pill.id}
              className={`flex h-11 flex-1 items-center justify-center rounded-[10px] text-sm font-medium ${
                bound === pill.id
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "bg-surface-2 text-muted-foreground"
              }`}
              data-testid={`scenario-pill-${pill.id}`}
            >
              {pill.label}
            </button>
          ))}
        </div>
        {selected == null ? (
          <div className="py-1">
            <MetricRow label={t("nightlyRange")} testid="economics-nightly">
              {nightlyRangeCents != null ? (
                <>
                  {usd(nightlyRangeCents.min)} – {usd(nightlyRangeCents.max)}
                  <ProvenanceInfo provenance="observed" />
                </>
              ) : nightlyFallbackText != null ? (
                <>
                  <span className="truncate">{nightlyFallbackText}</span>
                  <ProvenanceInfo provenance="observed" />
                </>
              ) : (
                <>{unavailableLabel("backend_absent")}</>
              )}
            </MetricRow>
            <MetricRow label={t("adrLabel")} testid="economics-adr">
              <span className="font-normal text-muted-foreground">
                {unavailableLabel("backend_absent")}
              </span>
              <ProvenanceInfo provenance="unknown" />
            </MetricRow>
            <MetricRow label={t("occupancyLabel")} testid="economics-occupancy">
              <span className="font-normal text-muted-foreground">
                {unavailableLabel("backend_absent")}
              </span>
              <ProvenanceInfo provenance="unknown" />
            </MetricRow>
            <MetricRow label={t("grossRevenue")} testid="economics-gross">
              <span className="font-normal text-muted-foreground">
                {unavailableLabel("backend_absent")}
              </span>
              <ProvenanceInfo provenance="unknown" />
            </MetricRow>
            <p
              className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground"
              data-testid="economics-pending-note"
            >
              {t("economicsPendingNote")}
            </p>
          </div>
        ) : (
          <>
            <div className="py-1">
              <MetricRow label={t("nightlyRange")} testid="economics-nightly">
                {nightlyRangeCents != null ? (
                  <>
                    {usd(nightlyRangeCents.min)} – {usd(nightlyRangeCents.max)}
                    <ProvenanceInfo provenance="observed" />
                  </>
                ) : (
                  <>{nightlyFallbackText ?? unavailableLabel("backend_absent")}</>
                )}
              </MetricRow>
              <MetricRow label={t("adrLabel")} testid="economics-adr">
                {usd(selected.result.resolution.adrUsd.value)}
                <ProvenanceInfo provenance={selected.adrProvenance} />
              </MetricRow>
              <MetricRow label={t("occupancyLabel")} testid="economics-occupancy">
                {pct(selected.occupancyValue)}
                <ProvenanceInfo provenance={selected.occupancyProvenance} />
              </MetricRow>
              <MetricRow label={t("grossRevenue")} testid="economics-gross">
                {usd(selected.result.economics.revenue.grossAnnualRevenueUsd)}
                <ProvenanceInfo provenance="calculated" />
              </MetricRow>
            </div>
            {envelopeRangeCents != null ? (
              <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground tnum" data-testid="economics-envelope">
                {t("revenueEnvelope", {
                  lower: usd(envelopeRangeCents.lower),
                  upper: usd(envelopeRangeCents.upper),
                })}
              </p>
            ) : null}
          </>
        )}
      </Block>
    </section>
  );
}
