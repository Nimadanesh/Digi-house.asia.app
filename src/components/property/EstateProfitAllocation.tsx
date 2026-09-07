// File responsibility: Estate tab profit-allocation section (contract §6E) —
// owner / operator / travel-agency shares with the basis of EACH percentage
// labeled. Unknown allocations (net profit not known) render as pending.
// The 18% agency cost line and the 18% travel-agency allocation stay separate:
// this section shows the allocation (share of gross); costs live in §6D.
import { useTranslations } from "next-intl";
import { pct, usd } from "@/lib/format";
import { unavailableLabel } from "@/lib/availability";
import { ESTATE_ALLOCATION_RATES } from "@/types/estate";
import type { EstateEconomics } from "@/types/estate";
import { Block } from "@/components/common/Block";
import { LabelStack } from "@/components/common/LabelStack";
import { Row } from "@/components/common/Row";
import { ProvenanceInfo } from "@/components/common/ProvenanceInfo";

export function EstateProfitAllocation({ economics }: { economics: EstateEconomics | null }) {
  const t = useTranslations("property");
  const netKnown = economics?.profit.netProfitKnown ?? false;
  // Without engine economics every allocation is pending (net/gross unknown);
  // the allocation bases stay labeled — model facts, never results.
  const agencyUsd = economics?.travelAgencyShareUsd;

  return (
    <section className="space-y-2" data-testid="estate-allocation">
      <h2 className="px-0.5 text-[0.9375rem] font-semibold text-foreground">
        {t("allocationTitle")}
      </h2>
      <Block className="overflow-hidden">
        <div className="py-1">
          <Row className="py-2">
            <LabelStack
              title={<span className="text-sm text-foreground">{t("allocOwner")}</span>}
              titleClassName="font-normal"
              hint={
                <>
                  {pct(ESTATE_ALLOCATION_RATES.ownerProfit)} {t("basisOfNet")}
                </>
              }
              hintClassName="tnum"
            />
            <span className="ml-auto flex items-center gap-1.5" data-testid="allocation-owner">
              {netKnown && economics ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(economics.profit.ownerProfitUsd)}
                  </span>
                  <ProvenanceInfo provenance="calculated" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {unavailableLabel("backend_absent")}
                  </span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
          <Row className="py-2">
            <LabelStack
              title={<span className="text-sm text-foreground">{t("allocOperator")}</span>}
              titleClassName="font-normal"
              hint={
                <>
                  {pct(ESTATE_ALLOCATION_RATES.operatorProfit)} {t("basisOfNet")}
                </>
              }
              hintClassName="tnum"
            />
            <span className="ml-auto flex items-center gap-1.5" data-testid="allocation-operator">
              {netKnown && economics ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(economics.profit.operatorProfitUsd)}
                  </span>
                  <ProvenanceInfo provenance="calculated" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {unavailableLabel("backend_absent")}
                  </span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
          <Row className="py-2">
            <LabelStack
              title={<span className="text-sm text-foreground">{t("allocAgency")}</span>}
              titleClassName="font-normal"
              hint={
                <>
                  {pct(ESTATE_ALLOCATION_RATES.travelAgency)} {t("basisOfGrossRevenue")}
                </>
              }
              hintClassName="tnum"
            />
            <span className="ml-auto flex items-center gap-1.5" data-testid="allocation-agency">
              {agencyUsd != null ? (
                <>
                  <span className="text-sm tnum font-semibold text-foreground">
                    {usd(agencyUsd)}
                  </span>
                  <ProvenanceInfo provenance="calculated" />
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">
                    {unavailableLabel("backend_absent")}
                  </span>
                  <ProvenanceInfo provenance="unknown" />
                </>
              )}
            </span>
          </Row>
        </div>
      </Block>
    </section>
  );
}
