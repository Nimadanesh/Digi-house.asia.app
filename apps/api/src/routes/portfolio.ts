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
  fetchPortfolioData,
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
      const held = await fetchPortfolioData(userId, deps);
      const propertiesById = new Map(
        held.map((r) => [
          r.propertyId,
          {
            totalShares: r.totalShares,
            sharePriceUsd: r.sharePriceUsd,
            annualRentUsd: r.annualRentUsd,
          },
        ]),
      );
      const openOrderRows = deps.orders
        ? await deps.orders.listOpenByUserId(userId)
        : [];
      const openOrders = openOrderRows.map(mapOrderRecord);
      const summary = buildPortfolioSummary(
        held.map((r) => ({
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
      const held = await fetchPortfolioData(userId, deps);
      const lines: string[] = [
        "propertyId,propertyName,shares,avgCostUsdCents,currentValueUsdCents,pendingWeekEarningsUsdCents,shareRatio",
      ];
      for (const r of held) {
        lines.push(
          [
            csvEscape(r.propertyId),
            csvEscape(r.title),
            String(r.sharesOwned),
            String(r.avgCostUsd),
            String(r.currentValueUsd),
            String(r.pendingWeekEarningsUsd),
            r.shareRatio.toFixed(6),
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
  if (/^[=+\-@]/.test(v)) {
    v = "'" + v;
  }
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
