"use client";
// File responsibility: Income tab §5 — Your net income (structure §5.5 +
// revision contract): the tab's strongest point. Distinct darker card with
// the contract hierarchy — net distributable income (secondary) → owner
// share → per-share / year (large) → per-share / month (the largest figure) →
// owner-side tax (small, with its provenance ⓘ) — all for the SELECTED
// scenario so the card always agrees with the scenario cards above. V1
// outputs only; Projected is never Paid/Accrued.
import { useTranslations } from "next-intl";
import { moneySmart } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import { v1ScenarioPerShareCents } from "@/lib/economics/property-presentation";
import type {
  FinancialModelV1PropertyModel,
  FinancialModelV1ScenarioResult,
} from "@/types/financial-model-v1";
import { cn } from "@/lib/utils";
import { Block } from "@/components/common/Block";
import { FactRow } from "@/components/common/FactRow";

export function NetEconomicsSection({
  v1,
  selected,
}: {
  v1: FinancialModelV1PropertyModel;
  selected: FinancialModelV1ScenarioResult;
}) {
  const t = useTranslations("property");
  const cur = (cents: number) => moneySmart(cents, v1.currency);
  const pending = unavailableLabel("backend_absent");
  const perShare = v1ScenarioPerShareCents(selected, v1.totalShares);

  return (
    <section className="space-y-2" data-testid="income-net">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("incomeNetTitle")}
      </h2>
      <Block className="overflow-hidden bg-surface-2 p-4 shadow-sm ring-1 ring-border/50 sm:p-5" data-testid="income-net-card">
        <div className="space-y-1">
          <FactRow
            label={t("incomeNetDistributable")}
            value={selected.netCents != null ? cur(selected.netCents) : pending}
            valueTestId="income-net-amount"
            provenance={selected.netCents != null ? "calculated" : "unknown"}
            valueMuted={selected.netCents == null}
          />
          <FactRow label={t("incomeOwnerShare")} value="75%" valueTestId="income-net-owner-share" />
        </div>
        <div className="my-3 border-t border-border/50" />
        <div className="space-y-2">
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {t("v1ThesisPerShare")} · {t("incomeV1PerYear")}
            </span>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap text-[1.25rem] font-bold leading-none tracking-tight tnum",
                perShare.annualCents != null ? "text-foreground" : "text-muted-foreground",
              )}
              data-testid="income-net-per-share-annual"
            >
              {perShare.annualCents != null ? cur(perShare.annualCents) : pending}
            </span>
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {t("v1ThesisPerShare")} · {t("incomeV1PerMonth")}
            </span>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap text-[1.375rem] font-bold leading-none tracking-tight tnum text-primary",
                perShare.monthlyCents == null && "text-muted-foreground",
              )}
              data-testid="income-net-per-share-monthly"
            >
              {perShare.monthlyCents != null ? cur(perShare.monthlyCents) : pending}
            </span>
          </div>
        </div>
        <div className="pt-2">
          <FactRow
            label={t("incomeOwnerTaxLabel")}
            value={selected.ownerTaxCents != null ? cur(selected.ownerTaxCents) : pending}
            valueTestId="income-net-tax"
            provenance={selected.ownerTaxCents != null ? "calculated" : "unknown"}
            valueMuted
          />
        </div>
        <p className="pt-2 text-xs leading-relaxed text-muted-foreground/80">
          {t("incomeNetFooter")}
        </p>
      </Block>
    </section>
  );
}
