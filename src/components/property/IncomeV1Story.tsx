// File responsibility: property-level Income tab conviction story (PROMPT 05) —
// the V1 economic chain for THIS estate: rental basis (ANR) → scenario revenue
// (220/273/328 modeled nights) → modeled costs (5%/7.5%/1.5%) → owner-side tax
// → net profit → owner share (75%) → per-share Projected economics, plus the
// honest position state (Accrued unpaid from locks; Paid lives on global
// Income). V1 is the only calculation authority: all figures arrive via the
// v1 model prop, components never recompute. Projected is never presented as
// Paid/Accrued; UNKNOWN (unknown tax, EUR mixed currency) stays UNKNOWN with
// the engine's stated reason; guest-paid charges are disclosed, never deducted.
// DEC-014 (Layer 2): every figure row renders through FactRow — ⓘ leads the
// label, the whole row opens the provenance sheet, figures are compact money
// (M/K) and never wrap; long explanatory notes clamp with Show more/less so a
// content-heavy tab can never break row alignment.
"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { moneySmart, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type {
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";
import { v1AnrToCents } from "@/lib/economics/financial-model-v1";

type V1Key = "conservative" | "base" | "optimistic" | "average";

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
  const cur = (cents: number) => moneySmart(cents, selected.currency);

  return (
    <div className="space-y-5" data-testid="income-v1-story">
      {/* ── Rental basis (ANR — never ADR) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Basis")}
        </h2>
        <Block className="p-4" data-testid="income-v1-basis">
          <FactRow
            label={t("v1ThesisAnr")}
            value={moneySmart(anrCents, v1.currency)}
            valueTestId="income-v1-anr"
            provenance={anrProvenance}
            caption={t("v1AnrNote")}
          />
          <div className="pb-1 pt-1">
            <p className="text-xs leading-relaxed text-muted-foreground" data-testid="income-v1-anr-method">
              {v1.anr.method}
            </p>
          </div>
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
            <FactRow
              label={scenario === "average" ? t("scenarioAverage") : t("v1ThesisRevenue")}
              value={cur(selected.grossCents)}
              valueTestId="income-v1-gross"
              provenance="calculated"
              caption={t("v1ScenarioNote")}
            />
            <FactRow
              label={selected.nights != null ? `${selected.nights} nights` : "Mean gross"}
              value={
                selected.nights != null
                  ? `ANR × ${selected.nights}`
                  : "Mean of the three scenarios"
              }
              valueTestId="income-v1-nights"
              muted
              valueMuted
            />
          </div>
        </Block>
      </section>

      {/* ── Modeled costs (5% / 7.5% / 1.5% — V1 only) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Costs")}
        </h2>
        <Block className="overflow-hidden" data-testid="income-v1-costs">
          <div className="py-1">
            <FactRow
              label={t("incomeV1CostAgency")}
              value={cur(selected.agencyCents)}
              valueTestId="income-v1-cost-agency"
              provenance="calculated"
            />
            <FactRow
              label={t("incomeV1CostOperator")}
              value={cur(selected.operatorCents)}
              valueTestId="income-v1-cost-operator"
              provenance="calculated"
            />
            <FactRow
              label={t("incomeV1CostReserve")}
              value={moneySmart(selected.reserveCents, selected.reserveCurrency)}
              valueTestId="income-v1-cost-reserve"
              provenance="calculated"
              caption={t("incomeV1ReserveNote")}
            />
          </div>
        </Block>
      </section>

      {/* ── Owner-side tax → Net → Owner 75% ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Tax")}
        </h2>
        <Block className="overflow-hidden" data-testid="income-v1-tax">
          <div className="py-1">
            <FactRow
              label={
                v1.ownerTax.kind === "rate"
                  ? `${v1.ownerTax.jurisdiction} · ${Math.round(v1.ownerTax.rate * 1000) / 10}%`
                  : v1.ownerTax.jurisdiction
              }
              value={selected.ownerTaxCents != null ? cur(selected.ownerTaxCents) : pending}
              valueTestId="income-v1-tax-amount"
              provenance={selected.ownerTaxCents != null ? "calculated" : "unknown"}
              valueMuted={selected.ownerTaxCents == null}
              caption={t("incomeV1TaxNote")}
            />
          </div>
        </Block>
      </section>

      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Net")}
        </h2>
        <Block className="p-4" data-testid="income-v1-net">
          <FactRow
            label={t("incomeV1Net")}
            value={selected.netCents != null ? cur(selected.netCents) : pending}
            valueTestId="income-v1-net-amount"
            provenance={selected.netCents != null ? "calculated" : "unknown"}
            valueMuted={selected.netCents == null}
            caption={selected.netCents == null && selected.unknownReason ? selected.unknownReason : null}
          />
        </Block>
      </section>

      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Owner")}
        </h2>
        <Block className="p-4" data-testid="income-v1-owner">
          <FactRow
            label={t("incomeV1Owner")}
            value={selected.ownerProfitCents != null ? cur(selected.ownerProfitCents) : pending}
            valueTestId="income-v1-owner-amount"
            provenance={selected.ownerProfitCents != null ? "calculated" : "unknown"}
            valueMuted={selected.ownerProfitCents == null}
            caption={t("incomeV1OperatorNote")}
          />
        </Block>
      </section>

      {/* ── Per-share Projected (average-based — never Paid/Accrued) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1PerShare")}
        </h2>
        <Block className="p-4" data-testid="income-v1-pershare">
          <FactRow
            label={`${t("v1ThesisPerShare")} ${t("incomeV1PerYear")}`}
            value={
              perShare.annualCents != null
                ? `${moneySmart(perShare.annualCents, perShare.currency)} ${t("incomeV1PerYear")}`
                : pending
            }
            valueTestId="income-v1-pershare-annual"
            provenance={perShare.annualCents != null ? "projected" : "unknown"}
            valueMuted={perShare.annualCents == null}
            caption={
              perShare.annualCents != null
                ? t("incomeV1ProjectionNote")
                : perShare.unknownReason ?? null
            }
          />
          <FactRow
            label={`${t("v1ThesisPerShare")} ${t("incomeV1PerMonth")}`}
            value={
              perShare.monthlyCents != null
                ? `${moneySmart(perShare.monthlyCents, perShare.currency)} ${t("incomeV1PerMonth")}`
                : pending
            }
            valueTestId="income-v1-pershare-monthly"
            provenance={perShare.monthlyCents != null ? "projected" : "unknown"}
            valueMuted={perShare.monthlyCents == null}
          />
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
                <div key={c.name} data-testid="income-v1-excluded-row">
                  <FactRow label={c.name} value="" muted caption={c.detail} />
                </div>
              ))}
            </div>
            <p className="pt-2 text-xs leading-relaxed text-muted-foreground">{t("incomeV1ExcludedNote")}</p>
          </Block>
        </section>
      ) : null}

      {/* ── Your position income: Accrued (real) vs Paid (global ledger) ── */}
      <section className="space-y-2">
        <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
          {t("incomeV1Position")}
        </h2>
        <Block className="p-4" data-testid="income-v1-position">
          <FactRow
            label={t("incomeV1Accrued")}
            value={usd(accruedUnpaidUsd)}
            valueTestId="income-v1-accrued"
          />
          {scalePosition && ownedShares > 0 && perShare.annualCents != null ? (
            <FactRow
              label={`${t("ownershipV1Projected")} (${ownedShares})`}
              value={`${moneySmart(perShare.annualCents * ownedShares, perShare.currency)} ${t("incomeV1PerYear")}`}
              valueTestId="income-v1-position-projected"
              provenance="projected"
            />
          ) : null}
          <div className="pt-2">
            <FactRow label={t("incomeV1PaidNote")} value="" muted />
          </div>
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
