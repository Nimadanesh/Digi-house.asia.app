import { Hono } from "hono";
import { isPropertyStatus } from "../marketplace/map-listing.js";
import type { PropertyStore } from "../marketplace/property-store.js";

export type MarketplaceRouteDeps = {
  properties: PropertyStore;
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
    return c.json(listings);
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
    return c.json(listing);
  });

  return app;
}
