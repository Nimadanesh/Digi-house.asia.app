import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import { buildOrderBookState } from "../orders/build-order-book.js";
import { mapOrderRecord, type OrderSide } from "../orders/map-order.js";
import type { OrderStore } from "../orders/order-store.js";
import { slidingWindowRateLimit } from "../lib/rate-limit.js";
import { requireAllowlist } from "../middleware/require-allowlist.js";
import type { LaunchMode } from "../launch/allowlist.js";

export type OrderRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  properties: PropertyStore;
  orders: OrderStore;
  holdings?: HoldingStore | null;
  audit?: AuditStore | null;
  rateLimiter?: MiddlewareHandler;
  allowlist: Set<string>;
  launchMode: LaunchMode;
};

function isOrderSide(v: unknown): v is OrderSide {
  return v === "buy" || v === "sell";
}

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

export function createOrderRoutes(deps: OrderRouteDeps) {
  const app = new Hono();

  app.get("/v1/properties/:id/order-book", async (c) => {
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
    const open = await deps.orders.listOpenByPropertyId(id);
    const book = buildOrderBookState(
      id,
      open.map((o) => ({
        side: o.side,
        priceUsd: o.priceUsd,
        quantity: o.quantity,
        filledQuantity: o.filledQuantity,
      })),
    );
    return c.json(book);
  });

  const orderRateLimit =
    deps.rateLimiter ??
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 30,
      key: (c) => c.get("userId") as string,
    });

  const allowlistMw = requireAllowlist(
    deps.allowlist,
    deps.launchMode,
    (c) => c.get("user")?.walletAddress ?? "",
  );

  app.post(
    "/v1/orders",
    requireSession({ session: deps.session, users: deps.users }),
    allowlistMw,
    orderRateLimit,
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(
          { code: "validation_error", message: "Invalid JSON body" },
          400,
        );
      }

      if (!body || typeof body !== "object") {
        return c.json(
          { code: "validation_error", message: "Invalid request body" },
          400,
        );
      }

      const b = body as Record<string, unknown>;
      const propertyId =
        typeof b.propertyId === "string" ? b.propertyId.trim() : "";
      const side = b.side;
      const priceUsd = b.priceUsd;
      const quantity = b.quantity;

      if (!propertyId) {
        return c.json(
          { code: "validation_error", message: "propertyId is required" },
          400,
        );
      }
      if (!isOrderSide(side)) {
        return c.json(
          { code: "validation_error", message: "side must be buy or sell" },
          400,
        );
      }
      if (!isPositiveInt(priceUsd)) {
        return c.json(
          {
            code: "validation_error",
            message: "priceUsd must be an integer >= 1",
          },
          400,
        );
      }
      if (!isPositiveInt(quantity)) {
        return c.json(
          {
            code: "validation_error",
            message: "quantity must be an integer >= 1",
          },
          400,
        );
      }

      const listing = await deps.properties.getById(propertyId);
      if (!listing) {
        return c.json(
          { code: "not_found", message: "Property not found" },
          404,
        );
      }

      const userId = c.get("userId");
      const user = c.get("user");

      if (side === "sell" && deps.holdings) {
        const holdings = await deps.holdings.listByUserId(userId);
        const held =
          holdings.find((h) => h.propertyId === propertyId)?.sharesOwned ??
          0;
        if (held < quantity) {
          return c.json(
            {
              code: "validation_error",
              message: "Insufficient shares",
            },
            400,
          );
        }
      }

      const record = await deps.orders.insert({
        id: `ord_${crypto.randomUUID()}`,
        userId,
        propertyId,
        makerAddress: user.walletAddress ?? "",
        side,
        priceUsd,
        quantity,
      });
      return c.json(mapOrderRecord(record), 201);
    },
  );

  app.delete(
    "/v1/orders/:id",
    requireSession({ session: deps.session, users: deps.users }),
    async (c) => {
      const id = c.req.param("id");
      if (!id || id.trim() === "") {
        return c.json(
          { code: "not_found", message: "Order not found" },
          404,
        );
      }

      const userId = c.get("userId");
      const result = await deps.orders.cancelIfOpen(id, userId);
      if (!result.ok) {
        if (result.reason === "not_found") {
          return c.json(
            { code: "not_found", message: "Order not found" },
            404,
          );
        }
        if (result.reason === "forbidden") {
          return c.json(
            {
              code: "forbidden",
              message: "Not allowed to cancel this order",
            },
            403,
          );
        }
        return c.json(
          { code: "conflict", message: "Order is not open" },
          409,
        );
      }

      if (deps.audit) {
        await writeAuditEvent(deps.audit, {
          action: "order.cancel",
          actorType: "user",
          actorUserId: userId,
          resourceType: "order",
          resourceId: id,
          summary: `Order cancelled ${id}`,
          payload: {
            orderId: id,
            propertyId: result.record.propertyId,
            side: result.record.side,
            quantity: result.record.quantity,
            priceUsd: result.record.priceUsd,
          },
          requestId:
            (c.var as { requestId?: string }).requestId ?? null,
        });
      }

      return c.body(null, 204);
    },
  );

  return app;
}
