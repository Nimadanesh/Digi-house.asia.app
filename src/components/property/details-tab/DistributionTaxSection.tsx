"use client";
// File responsibility: Details tab §4 — Distribution & Tax (structure §7.4 +
// revision contract): the locked monthly income-model row, the honest
// schedule-status row, and the owner-side tax summary as a collapsed
// expandable row carrying the locked D11 disclosure (plus the Maldives
// supplement for villa 1 only). No payout math lives here.
import { useTranslations } from "next-intl";
import { ESTATE_OWNER_TAX_DISCLOSURE } from "@/lib/economics/estates/estate-page-constants";
import { getEstate24ByRuntimeId } from "@/lib/economics/estates/estate-24-data";
import {
  ExpandableCostRows,
  type CostRowItem,
} from "@/components/property/ExpandableCostRows";

export function DistributionTaxSection({ propertyId }: { propertyId: string }) {
  const t = useTranslations("property");
  const isMaldives = getEstate24ByRuntimeId(propertyId)?.id === 1;
  const taxSummary = isMaldives
    ? `${ESTATE_OWNER_TAX_DISCLOSURE.paragraph} ${ESTATE_OWNER_TAX_DISCLOSURE.maldivesNote}`
    : ESTATE_OWNER_TAX_DISCLOSURE.paragraph;
  const rows: CostRowItem[] = [
    {
      id: "tax-summary",
      label: t("distributionTaxSummaryLabel"),
      value: t("distributionTaxSummaryValue"),
      detail: taxSummary,
    },
  ];
  return (
    <section className="space-y-2" data-testid="details-distribution">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("distributionTitle")}
      </h2>
      <div className="bg-card rounded-[12px] p-4" data-testid="details-distribution-card">
        <div className="space-y-1">
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 py-1">
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {t("distributionAccrualLabel")}
            </span>
            <span
              className="shrink-0 whitespace-nowrap text-sm tnum font-semibold text-foreground"
              data-testid="details-distribution-accrual"
            >
              {t("distributionAccrualValue")}
            </span>
          </div>
          <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2 py-1">
            <span className="min-w-0 truncate text-sm text-muted-foreground">
              {t("distributionScheduleLabel")}
            </span>
            <span
              className="shrink-0 whitespace-nowrap text-sm tnum font-semibold text-muted-foreground"
              data-testid="details-distribution-schedule"
            >
              {t("distributionScheduleValue")}
            </span>
          </div>
        </div>
        <div className="pt-1">
          <ExpandableCostRows rows={rows} testId="details-distribution-rows" />
        </div>
      </div>
    </section>
  );
}
