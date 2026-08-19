import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type { MiddlewareHandler } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { ShareLockStore } from "../yield/lock-store.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { FeeTierStore } from "../fees/fee-tier-store.js";
import type { TradeStore } from "../orders/trade-store.js";
import { buyEscrowUsd, settleMatchesForTaker } from "../orders/settle-matches.js";
import { computeFreeShares } from "../sells/free-shares.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import { buildOrderBookState } from "../orders/build-order-book.js";
import { mapOrderRecord, type OrderSide, type OrderStatus } from "../orders/map-order.js";
import type { OrderStore } from "../orders/order-store.js";
import type { TxStore } from "../buys/tx-store.js";
import { slidingWindowRateLimit } from "../lib/rate-limit.js";
import { requireAllowlist } from "../middleware/require-allowlist.js";
import type { LaunchMode } from "../launch/allowlist.js";

export type OrderRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  properties: PropertyStore;
  orders: OrderStore;
  holdings?: HoldingStore | null;
  /** Present → sell orders respect locked shares (§0.4) during free-shares validation. */
  locks?: ShareLockStore | null;
  /** Present → buy orders escrow funds and crossing orders execute (PD-01/PD-02). */
  balances?: BalanceStore | null;
  feeTiers?: FeeTierStore | null;
  trades?: TradeStore | null;
  transactions?: TxStore | null;
  audit?: AuditStore | null;
  rateLimiter?: MiddlewareHandler;
  allowlist: Set<string>;
  launchMode: LaunchMode;
  notify?: { botToken: string } | null;
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
    // PD-04: last executed price from the trades ledger.
    if (deps.trades) {
      const last = await deps.trades.lastPriceUsd(id);
      if (last != null) book.lastTradeUsd = last;
    }
    return c.json(book);
  });

  app.get("/v1/properties/:id/trades", async (c) => {
    const id = c.req.param("id");
    if (!deps.trades) {
      return c.json(
        { code: "not_configured", message: "Trades not available" },
        501,
      );
    }
    if (!id || id.trim() === "") {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }
    const listing = await deps.properties.getById(id);
    if (!listing) {
      return c.json({ code: "not_found", message: "Property not found" }, 404);
    }
    const limit = Math.min(Number(c.req.query("limit") ?? 20) || 20, 100);
    const rows = await deps.trades.listByProperty(id, { limit });
    return c.json({
      trades: rows.map((t) => ({
        id: t.id,
        propertyId: t.propertyId,
        priceUsd: t.priceUsd,
        quantity: t.quantity,
        buyFeeUsd: t.buyFeeUsd,
        sellFeeUsd: t.sellFeeUsd,
        createdAt: t.createdAt.toISOString(),
      })),
    });
  });

  /**
   * GET /v1/properties/:id/order-book/stream (PD-05) — SSE live book. Emits a
   * snapshot on connect, then a fresh event whenever the book JSON changes
   * (polled every 3s server-side; no pub/sub infra needed at this scale).
   */
  app.get("/v1/properties/:id/order-book/stream", (c) => {
    const id = c.req.param("id");
    return streamSSE(c, async (stream) => {
      let last = "";
      const emit = async () => {
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
        if (deps.trades) {
          const last = await deps.trades.lastPriceUsd(id);
          if (last != null) book.lastTradeUsd = last;
        }
        const json = JSON.stringify(book);
        if (json !== last) {
          last = json;
          await stream.writeSSE({ data: json, event: "book" });
        }
      };
      await emit();
      // ~10 minutes of 3s polls, then close (EventSource auto-reconnects).
      for (let i = 0; i < 200 && !stream.aborted; i++) {
        await stream.sleep(3_000);
        try {
          await emit();
        } catch {
          break;
        }
      }
    });
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

      // Phase rules (§0.1/§0.3): while the primary offering is open, buys go through
      // /v1/buys and custom sells are parked as 'queued' until the Order Activation
      // Trigger fires. 'funded' (legacy sold-out) and 'resale' both have an open book.
      const primaryPhase = listing.status === "funding";
      if (side === "buy" && primaryPhase) {
        return c.json(
          {
            code: "invalid_phase",
            message:
              "Primary offering is still open — buy shares directly, the order book opens after sellout",
          },
          409,
        );
      }
      let status: OrderStatus = "open";
      if (side === "sell" && primaryPhase) {
        status = "queued";
      }

      // Buy escrow (PD-01): live buy orders hold notional + tier fee aside from the
      // investing balance. Escrow failure = insufficient funds → 409 before any write.
      let escrowTotal = 0;
      if (side === "buy" && status === "open" && deps.balances && deps.feeTiers) {
        const tiers = await deps.feeTiers.listAll();
        const escrow = buyEscrowUsd(tiers, priceUsd, quantity);
        if (!escrow) {
          return c.json(
            { code: "no_fee_tier", message: "No fee tier covers this amount" },
            409,
          );
        }
        escrowTotal = escrow.total;
        try {
          await deps.balances.adjust(userId, { investingDelta: -escrowTotal });
        } catch {
          return c.json(
            {
              code: "insufficient_funds",
              message: `Investing balance too low — need $${(escrowTotal / 100).toFixed(2)} (order + fee) in escrow`,
            },
            409,
          );
        }
      }

      if (side === "sell" && deps.holdings) {
        // Escrow validation (§0.3): only free shares — not locked, not already in
        // another active (open/queued) sell order — can be listed.
        const free = await computeFreeShares(
          { holdings: deps.holdings, locks: deps.locks, orders: deps.orders },
          userId,
          propertyId,
        );
        if (quantity > free) {
          return c.json(
            {
              code: "insufficient_free_shares",
              message: `Only ${free} free share(s) available to sell`,
              freeShares: free,
            },
            409,
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
        status,
        escrowedUsd: escrowTotal,
      });

      // Matching (PD-02): a live taker crosses the book immediately.
      let executedQuantity = 0;
      if (status === "open" && deps.balances && deps.feeTiers && deps.trades && deps.holdings) {
        const result = await settleMatchesForTaker(
          {
            orders: deps.orders,
            trades: deps.trades,
            holdings: deps.holdings,
            balances: deps.balances,
            transactions: deps.transactions!,
            feeTiers: await deps.feeTiers.listAll(),
            audit: deps.audit ?? null,
          },
          record,
        );
        executedQuantity = result.fills.reduce((s, f) => s + f.quantity, 0);
      }

      if (deps.audit) {
        await writeAuditEvent(deps.audit, {
          action: "order.create",
          actorType: "user",
          actorUserId: userId,
          resourceType: "order",
          resourceId: record.id,
          summary: `${side} order ${status} · ${quantity} × $${(priceUsd / 100).toFixed(2)} on ${propertyId}`,
          payload: {
            orderId: record.id,
            propertyId,
            side,
            status,
            priceUsd,
            quantity,
          },
          requestId: (c.var as { requestId?: string }).requestId ?? null,
        });
      }

      if (status === "queued" && deps.notify) {
        try {
          await sendTelegramMessage({
            botToken: deps.notify.botToken,
            chatId: userId,
            text:
              `🕓 Sell order queued\n` +
              `${quantity} shares at $${(priceUsd / 100).toFixed(2)} — it goes live ` +
              `on the market when the primary offering sells out.`,
          });
        } catch {
          // fail-open
        }
      }

      const fresh = (await deps.orders.getById(record.id)) ?? record;
      return c.json(
        {
          ...mapOrderRecord(fresh),
          ...(executedQuantity > 0 ? { executedQuantity } : {}),
        },
        201,
      );
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
      if (result.ok && deps.balances) {
        // PD-08: refund whatever escrow the (possibly partially filled) order still holds.
        const released = await deps.orders.releaseEscrow(id);
        if (released > 0) {
          await deps.balances.adjust(result.record.userId, { investingDelta: released });
        }
      }
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
