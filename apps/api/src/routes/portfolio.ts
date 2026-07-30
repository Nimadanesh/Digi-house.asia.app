import { Hono } from "hono";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import { mapOrderRecord } from "../orders/map-order.js";
import type { OrderStore } from "../orders/order-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import {
  buildPortfolioSummary,
  type PropertyMark,
} from "../portfolio/map-portfolio.js";
import { projectedYieldUsd, weeklyRentUsd } from "../portfolio/math.js";

export type PortfolioRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  holdings: HoldingStore;
  properties: PropertyStore;
  orders?: OrderStore | null;
};

export function createPortfolioRoutes(deps: PortfolioRouteDeps) {
  const app = new Hono();

  app.get(
    "/v1/portfolio",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const userId = c.get("userId");
      const rows = await deps.holdings.listByUserId(userId);
      const uniqueIds = [...new Set(rows.map((r) => r.propertyId))];
      const listings = await deps.properties.getByIds(uniqueIds);
      const propertiesById = new Map<string, PropertyMark>();
      for (const [id, listing] of listings) {
        propertiesById.set(id, {
          totalShares: listing.totalShares,
          sharePriceUsd: listing.sharePriceUsd,
          annualRentUsd: listing.annualRentUsd,
        });
      }

      const openOrderRows = deps.orders
        ? await deps.orders.listOpenByUserId(userId)
        : [];
      const openOrders = openOrderRows.map(mapOrderRecord);

      const summary = buildPortfolioSummary(
        rows.map((r) => ({
          propertyId: r.propertyId,
          sharesOwned: r.sharesOwned,
          avgCostUsd: r.avgCostUsd,
        })),
        propertiesById,
        openOrders,
      );
      return c.json(summary);
    },
  );

  app.get(
    "/v1/portfolio/export.csv",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const userId = c.get("userId");
      const rows = await deps.holdings.listByUserId(userId);
      const uniqueIds = [...new Set(rows.map((r) => r.propertyId))];
      const listings = await deps.properties.getByIds(uniqueIds);
      const propertiesById = new Map<string, PropertyMark>();
      const nameById = new Map<string, string>();
      for (const [id, listing] of listings) {
        propertiesById.set(id, {
          totalShares: listing.totalShares,
          sharePriceUsd: listing.sharePriceUsd,
          annualRentUsd: listing.annualRentUsd,
        });
        nameById.set(id, listing.title);
      }

      const lines: string[] = [
        "propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio",
      ];

      for (const r of rows) {
        const prop = propertiesById.get(r.propertyId);
        if (!prop) continue;
        const currentValueUsd = r.sharesOwned * prop.sharePriceUsd;
        const weekly = weeklyRentUsd(prop.annualRentUsd);
        const pendingWeekEarningsUsd = projectedYieldUsd(
          weekly,
          r.sharesOwned,
          prop.totalShares,
        );
        const shareRatio =
          prop.totalShares > 0 ? r.sharesOwned / prop.totalShares : 0;
        const name = nameById.get(r.propertyId) ?? r.propertyId;
        lines.push(
          [
            csvEscape(r.propertyId),
            csvEscape(name),
            String(r.sharesOwned),
            String(r.avgCostUsd),
            String(currentValueUsd),
            String(pendingWeekEarningsUsd),
            shareRatio.toFixed(6),
          ].join(","),
        );
      }

      const csv = lines.join("\n");
      return c.newResponse(csv, 200, {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="portfolio.csv"`,
      });
    },
  );

  return app;
}

function csvEscape(v: string): string {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
