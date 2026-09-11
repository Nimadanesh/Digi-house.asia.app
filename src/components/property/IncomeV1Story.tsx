// File responsibility: property-level Income tab conviction story (PROMPT 05) —
// the V1 economic chain for THIS estate: rental basis (ANR) → scenario revenue
// (220/273/328 modeled nights) → modeled costs (5%/7.5%/1.5%) → owner-side tax
// → net profit → owner share (75%) → per-share Projected economics, plus the
// honest position state (Accrued unpaid from locks; Paid lives on global
// Income). V1 is the only calculation authority: all figures arrive via the
// v1 model prop, components never recompute. Projected is never presented as
// Paid/Accrued; UNKNOWN (unknown tax, EUR mixed currency) stays UNKNOWN with
// the engine's stated reason; guest-paid charges are disclosed, never deducted.
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { eur, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type {
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";
import { v1AnrToCents } from "@/lib/economics/financial-model-v1";

type V1Key = "conservative" | "base" | "optimistic" | "average";

function money(cents: number, currency: "USD" | "EUR"): string {
  return currency === "EUR" ? eur(cents) : usd(cents);
}

function ScenarioPills({
  selected,
  onSelect,
  labels,
}: {
  selected: V1Key;
  onSelect: (k: V1Key) => void;
  labels: Record<V1Key, string>;
}) {
  const order: V1Key[] = ["conservative", "base", "optimistic", "average"];
  return (
    <div className="flex gap-2 px-4 pt-3" data-testid="income-v1-pills">
      {order.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onSelect(k)}
          aria-pressed={selected === k}
          className={`flex h-11 flex-1 items-center justify-center rounded-[10px] px-1 text-[0.8125rem] font-medium ${
            selected === k
              ? "bg-primary font-semibold text-primary-foreground"
              : "bg-surface-2 text-muted-foreground"
          }`}
          data-testid={`scenario-v1-${k}`}
        >
          {labels[k]}
        </button>
      ))}
    </div>
  );
}

export function IncomeV1Story({
  v1,
  accruedUnpaidUsd = 0,
  ownedShares = 0,
  scalePosition = false,
  onViewEarnings,
}: {
  /** V1 model for this estate; null only without a V1 input (never legacy). */
  v1: FinancialModelV1PropertyModel | null;
  /** Real accrued unpaid across this property's active locks (display only). */
  accruedUnpaidUsd?: number;
  ownedShares?: number;
  /**
   * Whether owned shares scale with V1 per-share (same $100 share class).
   * False → per-share shown without position scaling (no approved cross-layer
   * rule is invented). True only when the trading price equals V1 nominal.
   */
  scalePosition?: boolean;
  /** Optional route to global Income (Paid ledger lives there). */
  onViewEarnings?: () => void;
}) {
  const t = useTranslations("property");
  const [scenario, setScenario] = useState<V1Key>("base");
  if (v1 == null) {
    return (
      <div className="space-y-5" data-testid="income-v1-story">
        <Block className="overflow-hidden">
          <p className="px-4 py-3 text-sm text-muted-foreground" data-testid="income-v1-unavailable">
            {unavailableLabel("backend_absent")}
          </p>
        </Block>
      </div>
    );
  }
  const selected: FinancialModelV1ScenarioResult = v1[scenario];
  const anrCents = v1AnrToCents(v1.anr.valueMajor);
  const anrProvenance = v1.anr.provenance === "OBSERVED_DERIVED" ? "observed" : "estimated";
  const perShare = v1.perShare;
  const pending = unavailableLabel("backend_absent");

  return (
    <div className="space-y-5" data-testid="income-v1-story">
      {/* ── Rental basis (ANR — never ADR) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Basis")}
        </h2>
        <Block className="p-4" data-testid="income-v1-basis">
          <Row>
            <span className="text-sm text-muted-foreground">{t("v1ThesisAnr")}</span>
            <span className="ml-auto flex min-w-0 items-center gap-1.5" data-testid="income-v1-anr">
              <span className="truncate text-sm tnum font-semibold text-foreground">
                {money(anrCents, v1.currency)}
              </span>
              <ProvenanceInfo provenance={anrProvenance} />
            </span>
          </Row>
          <p className="pt-3 text-xs leading-relaxed text-muted-foreground">{t("v1AnrNote")}</p>
          <p className="pt-1 text-xs leading-relaxed text-muted-foreground" data-testid="income-v1-anr-method">
            {v1.anr.method}
          </p>
        </Block>
      </section>

      {/* ── Scenario revenue (modeled nights — not occupancy) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Scenarios")}
        </h2>
        <Block className="overflow-hidden" data-testid="income-v1-scenarios">
          <ScenarioPills
            selected={scenario}
            onSelect={setScenario}
            labels={{
              conservative: t("scenarioConservative"),
              base: t("scenarioBase"),
              optimistic: t("scenarioOptimistic"),
              average: t("scenarioAverage"),
            }}
          />
          <div className="py-1">
            <Row>
              <span className="text-sm text-muted-foreground">
                {scenario === "average" ? t("scenarioAverage") : t("v1ThesisRevenue")}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-sm tnum font-semibold text-foreground" data-testid="income-v1-gross">
                {money(selected.grossCents, selected.currency)}
                <ProvenanceInfo provenance="calculated" />
              </span>
            </Row>
            <Row>
              <span className="text-sm text-muted-foreground">
                {selected.nights != null ? `${selected.nights} nights` : "Mean gross"}
              </span>
              <span className="ml-auto text-sm tnum text-muted-foreground" data-testid="income-v1-nights">
                {selected.nights != null
                  ? `ANR × ${selected.nights}`
                  : "Mean of the three scenarios"}
              </span>
            </Row>
          </div>
          <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">{t("v1ScenarioNote")}</p>
        </Block>
      </section>

      {/* ── Modeled costs (5% / 7.5% / 1.5% — V1 only) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Costs")}
        </h2>
        <Block className="overflow-hidden" data-testid="income-v1-costs">
          <div className="py-1">
            <Row>
              <span className="text-sm text-foreground">{t("incomeV1CostAgency")}</span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-cost-agency">
                <span className="text-sm tnum font-semibold text-foreground">
                  {money(selected.agencyCents, selected.currency)}
                </span>
                <ProvenanceInfo provenance="calculated" />
              </span>
            </Row>
            <Row>
              <span className="text-sm text-foreground">{t("incomeV1CostOperator")}</span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-cost-operator">
                <span className="text-sm tnum font-semibold text-foreground">
                  {money(selected.operatorCents, selected.currency)}
                </span>
                <ProvenanceInfo provenance="calculated" />
              </span>
            </Row>
            <Row>
              <span className="text-sm text-foreground">{t("incomeV1CostReserve")}</span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-cost-reserve">
                <span className="text-sm tnum font-semibold text-foreground">
                  {money(selected.reserveCents, selected.reserveCurrency)}
                </span>
                <ProvenanceInfo provenance="calculated" />
              </span>
            </Row>
          </div>
          <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">{t("incomeV1ReserveNote")}</p>
        </Block>
      </section>

      {/* ── Owner-side tax → Net → Owner 75% ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Tax")}
        </h2>
        <Block className="overflow-hidden" data-testid="income-v1-tax">
          <div className="py-1">
            <Row>
              <span className="text-sm text-muted-foreground">
                {v1.ownerTax.kind === "rate"
                  ? `${v1.ownerTax.jurisdiction} · ${Math.round(v1.ownerTax.rate * 1000) / 10}%`
                  : v1.ownerTax.jurisdiction}
              </span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-tax-amount">
                {selected.ownerTaxCents != null ? (
                  <>
                    <span className="text-sm tnum font-semibold text-foreground">
                      {money(selected.ownerTaxCents, selected.currency)}
                    </span>
                    <ProvenanceInfo provenance="calculated" />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">{pending}</span>
                    <ProvenanceInfo provenance="unknown" />
                  </>
                )}
              </span>
            </Row>
          </div>
          <p className="px-4 pb-3 text-xs leading-relaxed text-muted-foreground">{t("incomeV1TaxNote")}</p>
        </Block>
      </section>

      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Net")}
        </h2>
        <Block className="p-4" data-testid="income-v1-net">
          <Row>
            <span className="text-sm text-muted-foreground">{t("incomeV1Net")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-net-amount">
              {selected.netCents != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {money(selected.netCents, selected.currency)}
                  </span>
                  <ProvenanceInfo provenance="calculated" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">{pending}</span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
          {selected.netCents == null && selected.unknownReason ? (
            <p className="pt-3 text-xs leading-relaxed text-muted-foreground" data-testid="income-v1-unknown-note">
              {selected.unknownReason}
            </p>
          ) : null}
        </Block>
      </section>

      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Owner")}
        </h2>
        <Block className="p-4" data-testid="income-v1-owner">
          <Row>
            <span className="text-sm text-muted-foreground">{t("incomeV1Owner")}</span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-owner-amount">
              {selected.ownerProfitCents != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {money(selected.ownerProfitCents, selected.currency)}
                  </span>
                  <ProvenanceInfo provenance="calculated" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">{pending}</span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
          <p className="pt-3 text-xs leading-relaxed text-muted-foreground">{t("incomeV1OperatorNote")}</p>
        </Block>
      </section>

      {/* ── Per-share Projected (average-based — never Paid/Accrued) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1PerShare")}
        </h2>
        <Block className="p-4" data-testid="income-v1-pershare">
          <Row>
            <span className="text-sm text-muted-foreground">
              {t("v1ThesisPerShare")} {t("incomeV1PerYear")}
            </span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-pershare-annual">
              {perShare.annualCents != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {money(perShare.annualCents, perShare.currency)} {t("incomeV1PerYear")}
                  </span>
                  <ProvenanceInfo provenance="projected" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">{pending}</span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
          <Row>
            <span className="text-sm text-muted-foreground">
              {t("v1ThesisPerShare")} {t("incomeV1PerMonth")}
            </span>
            <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-pershare-monthly">
              {perShare.monthlyCents != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {money(perShare.monthlyCents, perShare.currency)} {t("incomeV1PerMonth")}
                  </span>
                  <ProvenanceInfo provenance="projected" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">{pending}</span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
          {perShare.annualCents != null ? (
            <p className="pt-3 text-xs leading-relaxed text-muted-foreground">
              {t("incomeV1ProjectionNote")}
            </p>
          ) : perShare.unknownReason ? (
            <p className="pt-3 text-xs leading-relaxed text-muted-foreground" data-testid="income-v1-pershare-unknown">
              {perShare.unknownReason}
            </p>
          ) : null}
        </Block>
      </section>

      {/* ── Listed charges: disclosed, never deducted ── */}
      {v1.excludedCharges.length > 0 ? (
        <section className="space-y-2">
          <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
            {t("incomeV1Excluded")}
          </h2>
          <Block className="p-4" data-testid="income-v1-excluded">
            <div className="space-y-2">
              {v1.excludedCharges.map((c) => (
                <p key={c.name} className="text-xs leading-relaxed text-muted-foreground" data-testid="income-v1-excluded-row">
                  <span className="font-medium text-foreground">{c.name}</span>
                  {" — "}
                  {c.detail}
                </p>
              ))}
            </div>
            <p className="pt-3 text-xs leading-relaxed text-muted-foreground">{t("incomeV1ExcludedNote")}</p>
          </Block>
        </section>
      ) : null}

      {/* ── Your position income: Accrued (real) vs Paid (global ledger) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Position")}
        </h2>
        <Block className="p-4" data-testid="income-v1-position">
          <Row>
            <span className="text-sm text-muted-foreground">{t("incomeV1Accrued")}</span>
            <span className="ml-auto text-sm tnum font-semibold text-foreground" data-testid="income-v1-accrued">
              {usd(accruedUnpaidUsd)}
            </span>
          </Row>
          {scalePosition && ownedShares > 0 && perShare.annualCents != null ? (
            <Row>
              <span className="text-sm text-muted-foreground">
                {t("ownershipV1Projected")} ({ownedShares})
              </span>
              <span className="ml-auto flex items-center gap-1.5" data-testid="income-v1-position-projected">
                <span className="text-sm tnum font-semibold text-foreground">
                  {money(perShare.annualCents * ownedShares, perShare.currency)} {t("incomeV1PerYear")}
                </span>
                <ProvenanceInfo provenance="projected" />
              </span>
            </Row>
          ) : null}
          <p className="pt-3 text-xs leading-relaxed text-muted-foreground">{t("incomeV1PaidNote")}</p>
          {onViewEarnings ? (
            <button
              type="button"
              onClick={onViewEarnings}
              className="mt-1 inline-flex min-h-[44px] items-center text-sm font-medium text-primary"
              data-testid="income-v1-view-earnings"
            >
              {t("incomeV1ViewEarnings")}
            </button>
          ) : null}
        </Block>
      </section>
    </div>
  );
}
