import { Hono } from "hono";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { requireSession } from "../auth/require-session.js";
import type { SessionConfig } from "../auth/session.js";
import type { UserStore } from "../auth/user-store.js";
import type { IntentStore } from "../buys/intent-store.js";
import {
  deriveHoldingPublic,
  nextAvgCostUsd,
  syntheticBuyTxHash,
} from "../buys/settle-buy.js";
import {
  mapTransactionPublic,
  type TxStore,
} from "../buys/tx-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import { slidingWindowRateLimit } from "../lib/rate-limit.js";

export type BuyRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  properties: PropertyStore;
  holdings: HoldingStore;
  intents: IntentStore;
  transactions: TxStore;
  audit?: AuditStore | null;
  tonRelayAddress?: string;
  buyStubNanoTon?: string;
  buyIntentTtlSeconds?: number;
};

function isPositiveInt(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1;
}

export function createBuyRoutes(deps: BuyRouteDeps) {
  const app = new Hono();
  const ttlSeconds = deps.buyIntentTtlSeconds ?? 900;
  const stubNano = deps.buyStubNanoTon ?? "10000000";

  app.post(
    "/v1/buys/prepare",
    requireSession({ session: deps.session, users: deps.users }),
    slidingWindowRateLimit({
      windowMs: 60_000,
      max: 15,
      key: (c) => c.get("userId"),
    }),
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
      const quantity = b.quantity;
      const priceUsdPerShare = b.priceUsdPerShare;

      if (!propertyId) {
        return c.json(
          { code: "validation_error", message: "propertyId is required" },
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
      if (!isPositiveInt(priceUsdPerShare)) {
        return c.json(
          {
            code: "validation_error",
            message: "priceUsdPerShare must be an integer >= 1",
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
      if (listing.status !== "funding") {
        return c.json(
          {
            code: "validation_error",
            message: "Primary sale is not open",
          },
          400,
        );
      }
      if (priceUsdPerShare !== listing.sharePriceUsd) {
        return c.json(
          {
            code: "validation_error",
            message: "priceUsdPerShare must match list price",
          },
          400,
        );
      }
      const remaining = listing.totalShares - listing.sharesSold;
      if (quantity > remaining) {
        return c.json(
          {
            code: "validation_error",
            message: "Quantity exceeds shares remaining",
          },
          400,
        );
      }

      const userId = c.get("userId");
      const totalUsd = quantity * priceUsdPerShare;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
      const intentId = `intent_${crypto.randomUUID()}`;

      await deps.intents.create({
        id: intentId,
        userId,
        propertyId,
        quantity,
        priceUsdPerShare,
        totalUsd,
        expiresAt,
      });

      const address =
        deps.tonRelayAddress?.trim() || listing.ownerWalletAddress || "";
      const tonConnectMessages = address
        ? [{ address, amount: stubNano, payload: null as null }]
        : [];

      return c.json({
        intentId,
        propertyId,
        quantity,
        priceUsdPerShare,
        totalUsd,
        tonConnectMessages,
        expiresAt: expiresAt.toISOString(),
      });
    },
  );

  app.post(
    "/v1/buys/confirm",
    requireSession({ session: deps.session, users: deps.users }),
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
      const intentId =
        typeof b.intentId === "string" ? b.intentId.trim() : "";
      const boc =
        b.boc === null || b.boc === undefined
          ? null
          : typeof b.boc === "string"
            ? b.boc
            : null;

      if (!intentId) {
        return c.json(
          { code: "validation_error", message: "intentId is required" },
          400,
        );
      }

      const userId = c.get("userId");
      const now = new Date();
      const claimed = await deps.intents.markConfirmedIfPending(
        intentId,
        userId,
        now,
        boc,
      );

      if (!claimed.ok) {
        if (
          claimed.reason === "not_found" ||
          claimed.reason === "not_owned"
        ) {
          return c.json(
            { code: "not_found", message: "Buy intent not found" },
            404,
          );
        }
        return c.json(
          {
            code: "conflict",
            message: "Buy intent already confirmed or expired",
          },
          409,
        );
      }

      const intent = claimed.intent;
      const listing = await deps.properties.getById(intent.propertyId);
      if (!listing) {
        return c.json(
          { code: "not_found", message: "Property not found" },
          404,
        );
      }

      const bumped = await deps.properties.tryIncrementSharesSold(
        intent.propertyId,
        intent.quantity,
      );
      if (!bumped) {
        return c.json(
          {
            code: "conflict",
            message: "Insufficient shares remaining",
          },
          409,
        );
      }

      const existing = await deps.holdings.get(
        userId,
        intent.propertyId,
      );
      const oldShares = existing?.sharesOwned ?? 0;
      const oldAvg = existing?.avgCostUsd ?? 0;
      const newShares = oldShares + intent.quantity;
      const newAvg = nextAvgCostUsd(
        oldShares,
        oldAvg,
        intent.quantity,
        intent.priceUsdPerShare,
      );

      const holdingRow = await deps.holdings.upsert({
        userId,
        propertyId: intent.propertyId,
        sharesOwned: newShares,
        avgCostUsd: newAvg,
      });

      const txId = `tx_${crypto.randomUUID()}`;
      const txHash = syntheticBuyTxHash(intent.id);
      const txRecord = await deps.transactions.insert({
        id: txId,
        userId,
        kind: "buy",
        propertyId: intent.propertyId,
        shares: intent.quantity,
        amountUsd: intent.totalUsd,
        status: "success",
        txHash,
        buyIntentId: intent.id,
      });

      const holding = deriveHoldingPublic(
        {
          propertyId: holdingRow.propertyId,
          sharesOwned: holdingRow.sharesOwned,
          avgCostUsd: holdingRow.avgCostUsd,
        },
        {
          totalShares: listing.totalShares,
          sharePriceUsd: listing.sharePriceUsd,
          annualRentUsd: listing.annualRentUsd,
        },
      );

      if (deps.audit) {
        await writeAuditEvent(deps.audit, {
          action: "buy.confirm",
          actorType: "user",
          actorUserId: userId,
          resourceType: "buy_intent",
          resourceId: intent.id,
          summary: `Buy confirmed ${intent.quantity} shares of ${intent.propertyId}`,
          payload: {
            intentId: intent.id,
            propertyId: intent.propertyId,
            quantity: intent.quantity,
            totalUsd: intent.totalUsd,
            transactionId: txRecord.id,
            settlementMode: "hybrid",
          },
          requestId:
            (c.var as { requestId?: string }).requestId ?? null,
        });
      }

      return c.json({
        transaction: mapTransactionPublic(txRecord),
        holding,
      });
    },
  );

  return app;
}
