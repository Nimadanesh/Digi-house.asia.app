import type { OrderPublic } from "../orders/map-order.js";
import {
  clampDayChangeRatio,
  projectedYieldUsd,
  weeklyRentUsd,
} from "./math.js";
import type { HoldingStore } from "./holding-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";

export type HoldingInput = {
  propertyId: string;
  sharesOwned: number;
  avgCostUsd: number;
};

export type PropertyMark = {
  totalShares: number;
  sharePriceUsd: number;
  annualRentUsd: number;
};

export type HoldingPublic = {
  propertyId: string;
  sharesOwned: number;
  avgCostUsd: number;
  currentValueUsd: number;
  pendingWeekEarningsUsd: number;
  shareRatio: number;
};

export type PortfolioSummaryPublic = {
  totalValueUsd: number;
  totalInvestedUsd: number;
  totalEarningsUsd: number;
  weeklyProjectedUsd: number;
  dayChangeRatio: number;
  holdings: HoldingPublic[];
  openOrders: OrderPublic[];
};

export function buildPortfolioSummary(
  holdings: HoldingInput[],
  propertiesById: Map<string, PropertyMark>,
  openOrders: OrderPublic[] = [],
): PortfolioSummaryPublic {
  const out: HoldingPublic[] = [];

  for (const h of holdings) {
    if (h.sharesOwned <= 0) continue;
    const prop = propertiesById.get(h.propertyId);
    if (!prop) continue;

    const weekly = weeklyRentUsd(prop.annualRentUsd);
    const currentValueUsd = h.sharesOwned * prop.sharePriceUsd;
    const pendingWeekEarningsUsd = projectedYieldUsd(
      weekly,
      h.sharesOwned,
      prop.totalShares,
    );
    const shareRatio =
      prop.totalShares > 0 ? h.sharesOwned / prop.totalShares : 0;

    out.push({
      propertyId: h.propertyId,
      sharesOwned: h.sharesOwned,
      avgCostUsd: h.avgCostUsd,
      currentValueUsd,
      pendingWeekEarningsUsd,
      shareRatio,
    });
  }

  const totalInvestedUsd = out.reduce(
    (s, h) => s + h.sharesOwned * h.avgCostUsd,
    0,
  );
  const totalValueUsd = out.reduce((s, h) => s + h.currentValueUsd, 0);
  const weeklyProjectedUsd = out.reduce(
    (s, h) => s + h.pendingWeekEarningsUsd,
    0,
  );

  return {
    totalValueUsd,
    totalInvestedUsd,
    totalEarningsUsd: 0,
    weeklyProjectedUsd,
    dayChangeRatio: clampDayChangeRatio(totalValueUsd, totalInvestedUsd),
    holdings: out,
    openOrders,
  };
}

export type PortfolioHoldingRow = {
  propertyId: string;
  title: string;
  sharesOwned: number;
  avgCostUsd: number;
  totalShares: number;
  sharePriceUsd: number;
  annualRentUsd: number;
  currentValueUsd: number;
  pendingWeekEarningsUsd: number;
  shareRatio: number;
};

export async function fetchPortfolioData(
  userId: string,
  deps: {
    holdings: Pick<HoldingStore, "listByUserId">;
    properties: Pick<PropertyStore, "getByIds">;
  },
): Promise<PortfolioHoldingRow[]> {
  const rows = await deps.holdings.listByUserId(userId);
  const uniqueIds = [...new Set(rows.map((r) => r.propertyId))];
  const listings = await deps.properties.getByIds(uniqueIds);

  const out: PortfolioHoldingRow[] = [];
  for (const r of rows) {
    const listing = listings.get(r.propertyId);
    if (!listing) continue;
    const weekly = weeklyRentUsd(listing.annualRentUsd);
    const currentValueUsd = r.sharesOwned * listing.sharePriceUsd;
    const pendingWeekEarningsUsd = projectedYieldUsd(
      weekly,
      r.sharesOwned,
      listing.totalShares,
    );
    const shareRatio =
      listing.totalShares > 0 ? r.sharesOwned / listing.totalShares : 0;
    out.push({
      propertyId: r.propertyId,
      title: listing.title,
      sharesOwned: r.sharesOwned,
      avgCostUsd: r.avgCostUsd,
      totalShares: listing.totalShares,
      sharePriceUsd: listing.sharePriceUsd,
      annualRentUsd: listing.annualRentUsd,
      currentValueUsd,
      pendingWeekEarningsUsd,
      shareRatio,
    });
  }
  return out;
}
