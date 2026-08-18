import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { TxStore } from "../buys/tx-store.js";
import type { Logger } from "../logger.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { OrderStore } from "../orders/order-store.js";
import type { ShareLockStore } from "../yield/lock-store.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import { slidingWindowRateLimit } from "../lib/rate-limit.js";
import type { InstantSellStore } from "../sells/instant-sell-store.js";
import { settleInstantSell } from "../sells/settle-instant-sell.js";

export type SellRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  properties: PropertyStore;
  holdings: HoldingStore;
  locks?: ShareLockStore | null;
  orders?: OrderStore | null;
  balances: BalanceStore;
  transactions: TxStore;
  instantSells: InstantSellStore;
  log?: Logger;
  audit?: AuditStore | null;
  rateLimiter?: MiddlewareHandler;
  notify?: { botToken: string } | null;
};

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

/**
 * POST /v1/sells/instant (PRODUCT-PLAN §0.3 / PC-02) — platform buy-back during the
 * primary offering: list price − 7%, shares return to supply, net credits investing.
 */
export function createSellRoutes(deps: SellRouteDeps) {
  const app = new Hono();

  const sessionMw = requireSession({ session: deps.session, users: deps.users });
  const rateLimit =
    deps.rateLimiter ??
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 10,
      key: (c) => c.get("userId"),
    });

  app.post("/v1/sells/instant", sessionMw, rateLimit, async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ code: "validation_error", message: "Invalid JSON body" }, 400);
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const propertyId =
      typeof b.propertyId === "string" ? b.propertyId.trim() : "";
    const shares = b.shares;

    if (!propertyId) {
      return c.json(
        { code: "validation_error", message: "propertyId is required" },
        400,
      );
    }
    if (!isPositiveInt(shares)) {
      return c.json(
        { code: "validation_error", message: "shares must be an integer >= 1" },
        400,
      );
    }

    const userId = c.get("userId");
    const result = await settleInstantSell(
      {
        properties: deps.properties,
        holdings: deps.holdings,
        locks: deps.locks,
        orders: deps.orders,
        balances: deps.balances,
        transactions: deps.transactions,
        instantSells: deps.instantSells,
        log: deps.log,
      },
      { userId, propertyId, shares },
    );

    if (!result.ok) {
      switch (result.code) {
        case "not_found":
          return c.json({ code: "not_found", message: "Property not found" }, 404);
        case "sale_paused":
          return c.json(
            { code: "sale_paused", message: "Primary sale is paused by admin" },
            409,
          );
        case "invalid_phase":
          return c.json(
            {
              code: "invalid_phase",
              message:
                "Instant sell is only available during the primary offering — place a market sell order instead",
            },
            409,
          );
        case "insufficient_free_shares":
          return c.json(
            {
              code: "insufficient_free_shares",
              message:
                "Not enough free shares (locked shares or open sell orders don't count)",
            },
            409,
          );
        default:
          return c.json(
            { code: "conflict", message: "Could not settle instant sell" },
            409,
          );
      }
    }

    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "sell.instant",
        actorType: "user",
        actorUserId: userId,
        resourceType: "instant_sell",
        resourceId: result.record.id,
        summary: `Instant sell settled: ${shares} shares of ${propertyId} at −7%`,
        payload: {
          instantSellId: result.record.id,
          propertyId,
          shares,
          grossUsd: result.record.grossUsd,
          feeUsd: result.record.feeUsd,
          netUsd: result.record.netUsd,
        },
        requestId: (c.var as { requestId?: string }).requestId ?? null,
      });
    }

    if (deps.notify) {
      try {
        await sendTelegramMessage({
          botToken: deps.notify.botToken,
          chatId: userId,
          text:
            `✅ Instant sell settled\n` +
            `${shares} shares · $${(result.record.netUsd / 100).toFixed(2)} credited ` +
            `(fee $${(result.record.feeUsd / 100).toFixed(2)} · 7%) to your investing balance.`,
        });
      } catch {
        // fail-open
      }
    }

    return c.json(
      {
        id: result.record.id,
        propertyId,
        shares,
        grossUsd: result.record.grossUsd,
        feeUsd: result.record.feeUsd,
        netUsd: result.record.netUsd,
        status: result.record.status,
        sharesRemaining: result.sharesRemaining,
        freeSharesAfter: result.freeSharesAfter,
      },
      201,
    );
  });

  return app;
}
