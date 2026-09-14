"use client";
// File responsibility: Income tab §3 — Modeled Costs (structure §5.3 + revision
// contract): the three locked V1 cost lines rendered through the shared
// ExpandableCostRows. Each row shows the basis AND the amount together
// ("5% of gross · $1.3M") and expands to the contract's detail bullets; the
// reserve carries the modeled-allocation note plus the engine's no-FX reason
// when mixed-currency. Labels are %-free (the % lives in the value). No
// "other operating cost" row exists — V1 defines no such line. Figures follow
// the selected scenario; this section formats only.
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import type {
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";
import {
  ExpandableCostRows,
  type CostRowItem,
} from "@/components/property/ExpandableCostRows";

export function ModeledCostsSection({
  v1,
  selected,
}: {
  v1: FinancialModelV1PropertyModel;
  selected: FinancialModelV1ScenarioResult;
}) {
  const t = useTranslations("property");
  const cur = (cents: number) => moneySmart(cents, v1.currency);
  const reserveBullets =
    selected.reserveSubtractable === false && selected.unknownReason
      ? [t("incomeReserveBullet"), selected.unknownReason]
      : [t("incomeReserveBullet")];

  const rows: CostRowItem[] = [
    {
      id: "agency",
      label: t("costAgencyOtaLabel"),
      value: `${t("costPctOfGross", { pct: 5 })} · ${cur(selected.agencyCents)}`,
      bullets: [
        t("costAgencyBullet1"),
        t("costAgencyBullet2"),
        t("costAgencyBullet3"),
      ],
    },
    {
      id: "operator",
      label: t("costOperatorLabel"),
      value: `${t("costPctOfGross", { pct: 7.5 })} · ${cur(selected.operatorCents)}`,
      bullets: [t("costOperatorBullet")],
    },
    {
      id: "reserve",
      label: t("costReserveFundLabel"),
      value: `${t("costPctOfValue", { pct: 1.5 })} · ${moneySmart(selected.reserveCents, selected.reserveCurrency)}`,
      valueMuted: selected.reserveSubtractable === false,
      bullets: reserveBullets,
    },
  ];

  return (
    <section className="space-y-2" data-testid="income-costs">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("incomeV1Costs")}
      </h2>
      <ExpandableCostRows rows={rows} testId="income-costs-rows" />
    </section>
  );
}
