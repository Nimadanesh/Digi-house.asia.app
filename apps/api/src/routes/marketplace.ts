import { Hono } from "hono";
import { isPropertyStatus } from "../marketplace/map-listing.js";
import type { ListingPublic } from "../marketplace/map-listing.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { TradeStore } from "../orders/trade-store.js";

export type MarketplaceRouteDeps = {
  properties: PropertyStore;
  /** Present → listings carry the latest secondary-market price (PD-04/PD-07). */
  trades?: TradeStore | null;
};

export function createMarketplaceRoutes(deps: MarketplaceRouteDeps) {
  const app = new Hono();

  app.get("/v1/marketplace", async (c) => {
    const statusRaw = c.req.query("status");
    const queryRaw = c.req.query("query");

    if (statusRaw !== undefined && statusRaw !== "") {
      if (!isPropertyStatus(statusRaw)) {
        return c.json(
          {
            code: "validation_error",
            message: "status must be funding, funded, or resale",
          },
          400,
        );
      }
    }

    const listings = await deps.properties.list({
      ...(statusRaw && isPropertyStatus(statusRaw)
        ? { status: statusRaw }
        : {}),
      ...(queryRaw !== undefined ? { query: queryRaw } : {}),
    });
    const withLastPrice = await attachLastPrice(deps.trades, listings);
    return c.json(withLastPrice);
  });

  app.get("/v1/properties/:id", async (c) => {
    const id = c.req.param("id");
    if (!id || id.trim() === "") {
      return c.json(
        { code: "not_found", message: "Property not found" },
        404,
      );
    }

    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json(
        { code: "not_found", message: "Property not found" },
        404,
      );
    }
    const last = deps.trades ? await deps.trades.lastPriceUsd(id) : null;
    return c.json({ ...listing, ...(last != null ? { lastTradeUsd: last } : {}) });
  });

  return app;
}

async function attachLastPrice(
  trades: TradeStore | null | undefined,
  listings: ListingPublic[],
): Promise<ListingPublic[]> {
  if (!trades) return listings;
  return Promise.all(
    listings.map(async (l) => {
      const last = await trades.lastPriceUsd(l.id);
      return last != null ? { ...l, lastTradeUsd: last } : l;
    }),
  );
}
