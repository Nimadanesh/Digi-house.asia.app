"use client";
// File responsibility: Holder Analytics tab composition (REDESIGN-SPEC §12) —
// lays out the six required ownership visualizations, all consuming the Phase 4
// shared holder/ownership datasets via lib/property-analytics. Works for both
// Primary and Secondary wherever holder data exists; no PII, no price charts.
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Listing } from "@/types/property";
import { getPropertyAnalytics } from "@/lib/property-analytics";
import { Block } from "@/components/common/Block";
import { HolderDonut } from "./charts/HolderDonut";
import { TopHoldersBar } from "./charts/TopHoldersBar";
import { OwnershipTreemap } from "./charts/OwnershipTreemap";
import { DistributionOverTime } from "./charts/DistributionOverTime";
import { HolderBubbleChart } from "./charts/HolderBubbleChart";
import { HolderStats } from "./charts/HolderStats";

export function HolderAnalytics({ listing }: { listing: Listing }) {
  const t = useTranslations("property");

  // The ONE shared Phase 4 dataset — every chart below consumes slices of it.
  const analytics = useMemo(() => getPropertyAnalytics(listing), [listing]);
  const { holders, ownershipHistory, metrics } = analytics;

  return (
    <div className="space-y-5" data-testid="holder-analytics">
      {/* §12.6 Holder statistics — same dataset as every chart below */}
      <HolderStats
        holders={holders}
        totalShares={metrics.totalShares}
        ownershipHistory={ownershipHistory}
      />

      {/* §12.1 Token Holder Distribution — Donut */}
      <Block className="space-y-3 p-4">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("holderDonutTitle")}
        </h3>
        <HolderDonut
          holders={holders}
          totalShares={metrics.totalShares}
          holderCount={ownershipHistory[ownershipHistory.length - 1]?.holderCount ?? 0}
        />
      </Block>

      {/* §12.2 Top Token Holders — Horizontal Bar */}
      <Block className="space-y-3 p-4">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("topHoldersTitle")}
        </h3>
        <TopHoldersBar holders={holders} totalShares={metrics.totalShares} />
      </Block>

      {/* §12.3 Ownership Treemap */}
      <Block className="space-y-3 p-4">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("treemapTitle")}
        </h3>
        <OwnershipTreemap holders={holders} totalShares={metrics.totalShares} />
      </Block>

      {/* §12.4 Token Distribution Over Time — Stacked Area */}
      <Block className="space-y-3 p-4">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("distributionOverTimeTitle")}
        </h3>
        <DistributionOverTime history={ownershipHistory} />
      </Block>

      {/* §12.5 Token Holder Bubble Chart */}
      <Block className="space-y-3 p-4">
        <h3 className="text-[0.9375rem] font-semibold text-foreground">
          {t("bubbleChartTitle")}
        </h3>
        <HolderBubbleChart holders={holders} totalShares={metrics.totalShares} />
      </Block>
    </div>
  );
}
