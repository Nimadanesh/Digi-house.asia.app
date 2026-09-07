// File responsibility: Estate tab cost-structure section (contract §6D) — every
// required cost line with its basis, behind a progressive-disclosure expander on
// mobile (summary first, full breakdown on tap). Consumes ONE engine output
// (`EstateEconomics`); unknown lines render as pending, never as zero-facts.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import type { EstateCostLine, EstateEconomics } from "@/types/estate";
import { Block } from "@/components/common/Block";
import { Disclosure } from "@/components/common/Disclosure";
import { LabelStack } from "@/components/common/LabelStack";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

const LINE_LABEL_KEY = {
  tourismTax: "costTourism",
  serviceCharge: "costService",
  greenTax: "costGreen",
  agencyRentalOta: "costAgency",
  operatorOperating: "costOperator",
  repairInsuranceMaintenance: "costReserve",
} as const;

/**
 * Exact rate display for cost bases (12.5%, 1.5%). The shared pct() helper
 * rounds to whole percent above 10% ("13%") — correct for yields, wrong for a
 * contract rate label. Pure presentation formatting, never economics.
 */
function exactRatePct(rate: number): string {
  return `${parseFloat((rate * 100).toFixed(4))}%`;
}

function BasisText({ line }: { line: EstateCostLine }) {
  const t = useTranslations("property");
  if (line.basis === "grossAnnualRevenue") return <>{exactRatePct(line.rate)} {t("basisOfGross")}</>;
  if (line.basis === "guestNights") return <>{usd(line.rate)} {t("basisGuestNights")}</>;
  return <>{exactRatePct(line.rate)} {t("basisOfValue")}</>;
}

export function EstateCostBreakdown({
  economics,
  pendingLines = null,
}: {
  economics: EstateEconomics | null;
  /**
   * Pending cost lines (all unknown, shared rate bases) for estates without
   * engine economics — the view-model builds these from the shared product
   * table, so the section keeps its structure with honest pending states.
   */
  pendingLines?: EstateCostLine[] | null;
}) {
  const t = useTranslations("property");
  const [open, setOpen] = useState(false);
  const lines = economics?.costs ?? pendingLines;
  const hasUnknown = lines?.some((c) => c.unknown) ?? false;
  // A total is a fact only when every line is known (pending lines zero it out).
  const totalUsd = economics != null && !hasUnknown ? economics.profit.totalCostsUsd : null;

  return (
    <section className="space-y-2" data-testid="estate-costs">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("costTitle")}
      </h2>
      {lines == null ? (
        <Block className="overflow-hidden">
          <p className="px-4 py-3 text-sm text-muted-foreground" data-testid="costs-unavailable">
            {t("economicsUnavailable")}
          </p>
        </Block>
      ) : (
        <Disclosure
          title={<span className="text-sm text-muted-foreground">{t("costTotal")}</span>}
          trailing={
            <>
              {totalUsd == null ? (
                <span className="text-sm text-muted-foreground" data-testid="costs-total">
                  {unavailableLabel("backend_absent")}
                </span>
              ) : (
                <span className="text-sm tnum font-semibold text-foreground" data-testid="costs-total">
                  {usd(totalUsd)}
                </span>
              )}
              <ProvenanceInfo provenance={totalUsd == null ? "unknown" : "calculated"} />
            </>
          }
          open={open}
          onOpenChange={setOpen}
          toggleTestId="costs-toggle"
          contentTestId="costs-content"
          contentClassName="border-t border-border py-1"
        >
          {lines.map((line) => (
            <Row key={line.id} className="py-2">
              <LabelStack
                title={<span className="text-sm text-foreground">{t(LINE_LABEL_KEY[line.id])}</span>}
                titleClassName="font-normal"
                hint={<BasisText line={line} />}
                hintClassName="tnum"
              />
              <span className="ml-auto flex items-center gap-1.5" data-testid={`cost-line-${line.id}`}>
                {line.unknown ? (
                  <span className="text-sm text-muted-foreground">
                    {unavailableLabel("backend_absent")}
                  </span>
                ) : (
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(line.amountUsd)}
                  </span>
                )}
              </span>
            </Row>
          ))}
        </Disclosure>
      )}
    </section>
  );
}
