"use client";
// File responsibility: compose the Income tab (Estate Page Structure §5 —
// conviction): Rental Basis → Scenario Revenue (Base default) → Modeled Costs
// → Excluded charges → Net Economics → the preserved position-income block.
// One selection state drives every scenario-linked section so the tab always
// reads as one coherent chain. V1 is the only calculation authority; pending
// states are honest; Projected is never Paid/Accrued.
import { useState } from "react";
import { unavailableLabel } from "@/lib/availability";
import type { FinancialModelV1PropertyModel } from "@/types/financial-model-v1";
import { RentalBasisSection } from "@/components/property/income-tab/RentalBasisSection";
import { ScenarioRevenueSection } from "@/components/property/income-tab/ScenarioRevenueSection";
import { ModeledCostsSection } from "@/components/property/income-tab/ModeledCostsSection";
import { ExcludedChargesSection } from "@/components/property/income-tab/ExcludedChargesSection";
import { NetEconomicsSection } from "@/components/property/income-tab/NetEconomicsSection";
import { PositionIncomeSection } from "@/components/property/income-tab/PositionIncomeSection";
import type { ScenarioKey } from "@/components/property/income-tab/ScenarioRevenueSection";

export function IncomeTabPanel({
  v1,
  propertyId,
  accruedUnpaidUsd = 0,
  ownedShares = 0,
  scalePosition = false,
  onViewEarnings,
}: {
  /** V1 model; null → the tab renders the honest unavailable state only. */
  v1: FinancialModelV1PropertyModel | null;
  propertyId: string;
  accruedUnpaidUsd?: number;
  ownedShares?: number;
  scalePosition?: boolean;
  onViewEarnings?: () => void;
}) {
  const [selectedKey, setSelectedKey] = useState<ScenarioKey>("base");

  if (v1 == null) {
    return (
      <div
        role="tabpanel"
        id="panel-income"
        aria-labelledby="tab-income"
        className="space-y-5"
        data-testid="panel-income"
      >
        <div className="rounded-[12px] bg-card p-4 shadow-sm ring-1 ring-border/50" data-testid="income-unavailable">
          <p className="text-sm text-muted-foreground">{unavailableLabel("backend_absent")}</p>
        </div>
      </div>
    );
  }
  const selected = v1[selectedKey];

  return (
    <div
      role="tabpanel"
      id="panel-income"
      aria-labelledby="tab-income"
      className="space-y-5"
      data-testid="panel-income"
    >
      <RentalBasisSection v1={v1} />
      <ScenarioRevenueSection
        v1={v1}
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
      />
      <ModeledCostsSection v1={v1} selected={selected} />
      <ExcludedChargesSection v1={v1} />
      <NetEconomicsSection v1={v1} selected={selected} />
      <PositionIncomeSection
        propertyId={propertyId}
        accruedUnpaidUsd={accruedUnpaidUsd}
        ownedShares={ownedShares}
        scalePosition={scalePosition}
        onViewEarnings={onViewEarnings}
      />
    </div>
  );
}
