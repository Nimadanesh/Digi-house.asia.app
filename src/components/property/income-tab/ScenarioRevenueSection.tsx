"use client";
// File responsibility: Income tab §2 — Scenario Revenue (structure §5.2 +
// revision contract): the four locked scenarios rendered through the shared
// ScenarioCards — Base expanded by default (caller-owned state). Expanded-card
// rows in the fixed contract order: modeled nights → modeled annual revenue
// (whole villa) → projected per-share / year and / month (the emphasized
// figures). Occupancy lives on the Rental Basis section, not here. Figures
// arrive from the V1 model; this section formats only.
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import {
  v1ScenarioPerShareCents,
} from "@/lib/economics/property-presentation";
import type {
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";
import { ScenarioCards } from "@/components/property/ScenarioCards";

export type ScenarioKey = "conservative" | "base" | "optimistic" | "average";
export const SCENARIO_ORDER: readonly ScenarioKey[] = [
  "conservative",
  "base",
  "optimistic",
  "average",
];

export function scenarioOf(
  v1: FinancialModelV1PropertyModel,
  key: ScenarioKey,
): FinancialModelV1ScenarioResult {
  return v1[key];
}

export function ScenarioRevenueSection({
  v1,
  selectedKey,
  onSelect,
}: {
  v1: FinancialModelV1PropertyModel;
  selectedKey: ScenarioKey;
  onSelect: (key: ScenarioKey) => void;
}) {
  const t = useTranslations("property");
  const currency = v1.currency;
  const cur = (cents: number) => moneySmart(cents, currency);
  const labelOf: Record<ScenarioKey, string> = {
    conservative: t("scenarioConservative"),
    base: t("scenarioBase"),
    optimistic: t("scenarioOptimistic"),
    average: t("scenarioAverage"),
  };

  const items = SCENARIO_ORDER.map((key) => {
    const scenario = scenarioOf(v1, key);
    const perShare = v1ScenarioPerShareCents(scenario, v1.totalShares);
    return {
      key,
      label: labelOf[key],
      headline:
        perShare.annualCents != null
          ? `${cur(perShare.annualCents)} / ${t("incomeV1PerYear")}`
          : unavailableLabel("backend_absent"),
      headlineNote:
        scenario.nights != null
          ? t("scenarioNightsNote", { nights: scenario.nights })
          : t("scenarioMeanGrossNote"),
      rows: [
        {
          label: t("scenarioModeledNights"),
          value:
            scenario.nights != null
              ? String(scenario.nights)
              : t("scenarioMeanGrossNote"),
          testId: `scenario-${key}-nights`,
        },
        {
          label: t("v1ThesisRevenue"),
          value: cur(scenario.grossCents),
          testId: `scenario-${key}-gross`,
        },
        {
          label: `${t("v1ThesisPerShare")} · ${t("incomeV1PerYear")}`,
          value: perShare.annualCents != null ? cur(perShare.annualCents) : unavailableLabel("backend_absent"),
          valueMuted: perShare.annualCents == null,
          emphasized: true,
          testId: `scenario-${key}-per-share-annual`,
        },
        {
          label: `${t("v1ThesisPerShare")} · ${t("incomeV1PerMonth")}`,
          value: perShare.monthlyCents != null ? cur(perShare.monthlyCents) : unavailableLabel("backend_absent"),
          valueMuted: perShare.monthlyCents == null,
          emphasized: true,
          testId: `scenario-${key}-per-share-monthly`,
        },
      ],
    };
  });

  return (
    <section className="space-y-2" data-testid="income-scenarios">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("incomeScenarioTitle")}
      </h2>
      <ScenarioCards
        items={items}
        selectedKey={selectedKey}
        onSelect={(key: string) => onSelect(key as ScenarioKey)}
      />
      <p className="px-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground/70" data-testid="income-scenarios-note">
        {t("v1ScenarioNote")}
      </p>
    </section>
  );
}
