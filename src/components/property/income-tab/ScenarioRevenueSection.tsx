"use client";
// File responsibility: Income tab §2 — Scenario Revenue (structure §5.2 +
// revision contract): the four locked scenarios rendered through the shared
// ScenarioCards — Base expanded by default (caller-owned state). Expanded-card
// rows in the fixed contract order: modeled nights → modeled annual revenue
// (whole villa) → projected per-share / year and / month (the emphasized
// figures). Occupancy lives on the Rental Basis section, not here. Figures
// arrive from the V1 model; this section formats only.
import { ChevronDown } from "lucide-react";
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
import { Block } from "@/components/common/Block";
import { cn } from "@/lib/utils";

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
      <div className="space-y-2" data-testid="scenario-cards">
        {items.map((item) => {
          const selected = item.key === selectedKey;
          return (
            <Block
              key={item.key}
              className={cn(
                "overflow-hidden transition-all duration-200 ease-out",
                selected
                  ? "shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-border"
                  : "ring-1 ring-border/40 hover:bg-surface-2/40",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(item.key as ScenarioKey)}
                aria-expanded={selected}
                aria-controls={`scenario-cards-${item.key}-detail`}
                className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-start transition-transform duration-200 ease-out active:scale-[0.99]"
                data-testid={`scenario-cards-${item.key}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold leading-tight tracking-[-0.01em] text-foreground">
                    {item.label}
                  </span>
                  {item.headlineNote ? (
                    <span className="mt-[2px] block truncate text-xs leading-tight text-muted-foreground">
                      {item.headlineNote}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      "whitespace-nowrap text-[0.9375rem] font-bold tracking-[-0.02em] tnum",
                      selected ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.headline}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={1.75}
                    aria-hidden
                    className={cn(
                      "text-muted-foreground/80 transition-transform duration-200 ease-out",
                      selected ? "rotate-180" : "",
                    )}
                  />
                </span>
              </button>
              {selected ? (
                <div
                  id={`scenario-cards-${item.key}-detail`}
                  className="mx-3 mb-3 rounded-[10px] bg-surface-2/60 px-3 py-1 ring-1 ring-border/40"
                  data-testid={`scenario-cards-${item.key}-detail`}
                >
                  {item.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 py-[7px]"
                      data-testid={row.testId}
                    >
                      <span className="min-w-0 truncate text-[0.8125rem] leading-snug text-muted-foreground">
                        {row.label}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 whitespace-nowrap text-sm tnum font-semibold tracking-tight",
                          row.emphasized && "text-primary",
                          row.valueMuted
                            ? "text-muted-foreground"
                            : row.emphasized
                              ? ""
                              : "text-foreground",
                        )}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </Block>
          );
        })}
      </div>
      <p className="px-0.5 text-[0.6875rem] leading-relaxed text-muted-foreground/70" data-testid="income-scenarios-note">
        {t("v1ScenarioNote")}
      </p>
    </section>
  );
}
