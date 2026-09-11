// File responsibility: PortfolioRepo mock impl.
import type { PortfolioRepo } from "@/lib/api/repos";
import type { PortfolioSummary } from "@/types/position";
import { PROPERTIES } from "./seed/properties";
import { HOLDINGS } from "./seed/holdings";
import { getEstateDisplayIdentity } from "@/lib/economics/estates/estate-display-identity";
import { seedPortfolioSummary } from "./seed";
import { liveOpenOrders } from "./orderbook";
import { sleep, jitter } from "./sleep";

export function MockPortfolioRepo(): PortfolioRepo {
  return {
    async summary(): Promise<PortfolioSummary> {
      await sleep(jitter());
      const base = seedPortfolioSummary();
      // Slice 5: live user-placed orders join the seed baseline — a placed order
      // is visible in Portfolio until it is cancelled (refresh resets the demo).
      return { ...base, openOrders: [...base.openOrders, ...liveOpenOrders()] };
    },
    async exportCsv(): Promise<string> {
      await sleep(jitter());
      // Canonical display names (Final PO Decision 6); fixture fallback for unmapped ids.
      const nameById = new Map(
        PROPERTIES.map((p) => [
          p.id,
          getEstateDisplayIdentity(p.id, { title: p.title }).name,
        ]),
      );
      const lines: string[] = [
        "propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio",
      ];
      for (const h of HOLDINGS) {
        lines.push(
          [
            csvEscape(h.propertyId),
            csvEscape(nameById.get(h.propertyId) ?? h.propertyId),
            String(h.sharesOwned),
            String(h.avgCostUsd),
            String(h.currentValueUsd),
            String(h.pendingWeekEarningsUsd),
            h.shareRatio.toFixed(6),
          ].join(","),
        );
      }
      return lines.join("\n");
    },
  };
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}