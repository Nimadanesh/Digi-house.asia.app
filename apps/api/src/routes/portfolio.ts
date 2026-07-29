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

  return app;
}
