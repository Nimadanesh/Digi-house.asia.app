"use client";
// File responsibility: Details tab §2 — Legal & Structure (structure §7.2 +
// revision contract): three collapsed expandable rows (TaskRows pattern) —
// Ownership structure (SPV · Leasehold on the Maldives villa, plain SPV
// elsewhere), Insurance (full property & liability, standard D3 wording;
// insurer/policy-year rows render ONLY with real data), and Valuation
// (date · APPROX with method/valuer details). Texts arrive from
// legal-structure-24.ts — nothing is authored or invented here.
import { useTranslations } from "next-intl";
import { getLegalStructureByPropertyId } from "@/lib/economics/estates/legal-structure-24";
import {
  ExpandableCostRows,
  type CostRowItem,
} from "@/components/property/ExpandableCostRows";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatValuationDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export function LegalStructureSection({ propertyId }: { propertyId: string }) {
  const t = useTranslations("property");
  const legal = getLegalStructureByPropertyId(propertyId);
  if (legal == null) return null;
  const rows: CostRowItem[] = [
    {
      id: "ownership",
      label: t("legalOwnershipLabel"),
      value: legal.legal.isMaldives ? t("legalValueSpvLeasehold") : t("legalValueSpv"),
      valueMuted: false,
      detail: legal.legal.text,
    },
    {
      id: "insurance",
      label: t("insuranceLabel"),
      value: t("insuranceValueFull"),
      detail: legal.insurance.coverage,
      // Insurer / policy year render only with real per-villa data (TBC → hidden).
      meta:
        legal.insurance.insurer != null
          ? [
              { label: t("insuranceInsurerLabel"), value: legal.insurance.insurer },
              ...(legal.insurance.policyYear != null
                ? [{ label: t("insurancePolicyYearLabel"), value: legal.insurance.policyYear }]
                : []),
            ]
          : undefined,
    },
    {
      id: "valuation",
      label: t("valuationLabel"),
      value: `${formatValuationDate(legal.valuation.valuationDate)} · ${t("transferStatusApprox")}`,
      meta: [
        { label: t("valuationMethodLabel"), value: t("valuationMethodValue") },
        { label: t("valuationValuerLabel"), value: legal.valuation.valuer },
      ],
    },
  ];
  return (
    <section className="space-y-2" data-testid="details-legal">
      <h2 className="px-0.5 text-[0.9375rem] font-normal text-foreground">
        {t("legalStructureTitle")}
      </h2>
      <div className="overflow-hidden rounded-[12px] shadow-sm ring-1 ring-border/50">
        <ExpandableCostRows rows={rows} testId="details-legal-rows" />
      </div>
    </section>
  );
}
