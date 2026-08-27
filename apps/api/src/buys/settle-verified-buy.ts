// File responsibility: settle a verified buy — the single place that turns a verified payment into
// shares (increment shares_sold, upsert the holding, write the success ledger row). Only called after
// on-chain verification succeeded. Claim-then-write: markSettled is the atomic double-settlement guard.
// On sellout it also fires the Order Activation Trigger (§0.3): funding → resale + queued sells open.
import type { IntentStore, BuyIntentRecord } from "./intent-store.js";
import { nextAvgCostUsd } from "./settle-buy.js";
import type { TxStore } from "./tx-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { OrderStore } from "../orders/order-store.js";
import type { Logger } from "../logger.js";
import { sendTelegramMessage } from "../notify/telegram-notify.js";
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import type { UserStore } from "../auth/user-store.js";
import type { NftStore } from "../nft/nft-store.js";
import { requestNftForHolding } from "../nft/request.js";

export type SettleVerifiedBuyDeps = {
  intents: IntentStore;
  properties: PropertyStore;
  holdings: HoldingStore;
  transactions: TxStore;
  /** Present → sellout activates queued sell orders (Order Activation Trigger). */
  orders?: OrderStore | null;
  log?: Logger;
  /** Optional audit trail for the sellout + order-activation state changes (PF-03). */
  audit?: AuditStore | null;
  /** Optional Telegram notify when a user's queued order becomes tradable. */
  notify?: { botToken: string } | null;
  /** Optional collectible-NFT stores — the NFT is a display-only receipt, never the ownership source. */
  nfts?: NftStore | null;
  nftQueue?: {
    add(job: { name: string; data: { holdingNftId: string } }): Promise<unknown>;
  } | null;
  nftMetadataBaseUrl?: string;
  nftCollectionAddress?: string | null;
  /** Resolves the fallback delivery wallet when the intent has no payer wallet. */
  users?: UserStore | null;
};

export type SettleVerifiedBuyResult =
  | { ok: true; alreadySettled?: boolean; soldOut?: boolean }
  | { ok: false; reason: "not_confirmed" | "not_found" | "not_owned" };

export async function settleVerifiedBuy(
  deps: SettleVerifiedBuyDeps,
  input: {
    intent: BuyIntentRecord;
    actualAmountNano?: string;
    actualJettonAmount?: string;
  },
): Promise<SettleVerifiedBuyResult> {
  const claimed = await deps.intents.markSettled(input.intent.id, input.intent.userId, new Date());
  if (!claimed.ok) {
    if (claimed.reason === "already_settled") return { ok: true, alreadySettled: true };
    return { ok: false, reason: claimed.reason };
  }

  // Property race guard: tryIncrementSharesSold refuses to exceed totalShares. With a valid intent,
  // this can only trip on a concurrent oversell; fail loudly rather than settle partially.
  const incremented = await deps.properties.tryIncrementSharesSold(
    input.intent.propertyId,
    input.intent.quantity,
  );
  if (!incremented) {
    throw new Error(`settle failed: no remaining shares for ${input.intent.propertyId}`);
  }

  // Sellout check on fresh data (another concurrent settle may have filled the supply).
  const afterIncrement = await deps.properties.getById(input.intent.propertyId);
  const soldOut =
    !!afterIncrement && afterIncrement.sharesRemaining <= 0;
  if (soldOut) {
    // Order Activation Trigger: one-way funding → resale, then queued sells go live.
    // Idempotent + race-safe (guarded UPDATE), so a double fire is harmless.
    await deps.properties.markSoldOut(input.intent.propertyId);
    if (deps.audit) {
      await writeAuditEvent(deps.audit, {
        action: "property.sellout",
        actorType: "system",
        actorLabel: "settleVerifiedBuy",
        resourceType: "property",
        resourceId: input.intent.propertyId,
        summary: `Primary offering sold out — ${input.intent.propertyId} moved to resale`,
        payload: {
          propertyId: input.intent.propertyId,
          intentId: input.intent.id,
        },
        requestId: null,
      });
    }
    if (deps.orders) {
      const activated = await deps.orders.activateQueuedForProperty(
        input.intent.propertyId,
      );
      if (activated.length > 0) {
        deps.log?.info(
          { propertyId: input.intent.propertyId, count: activated.length },
          "orders.activated_on_sellout",
        );
        for (const order of activated) {
          if (deps.audit) {
            await writeAuditEvent(deps.audit, {
              action: "order.activate",
              actorType: "system",
              actorLabel: "orderActivationTrigger",
              resourceType: "order",
              resourceId: order.id,
              summary: `Queued sell order went live on sellout of ${input.intent.propertyId}`,
              payload: {
                orderId: order.id,
                propertyId: input.intent.propertyId,
                userId: order.userId,
                priceUsd: order.priceUsd,
                quantity: order.quantity,
              },
              requestId: null,
            });
          }
          if (deps.notify) {
            try {
              await sendTelegramMessage({
                botToken: deps.notify.botToken,
                chatId: order.userId,
                text:
                  `📈 Your sell order is now live\n` +
                  `${order.quantity} shares listed at $${(order.priceUsd / 100).toFixed(2)} — ` +
                  `the primary offering sold out and the market is open.`,
              });
            } catch {
              // fail-open: notification must never break settlement
            }
          }
        }
      }
    }
  }

  const holding = await deps.holdings.get(input.intent.userId, input.intent.propertyId);
  const oldShares = holding?.sharesOwned ?? 0;
  const oldAvg = holding?.avgCostUsd ?? 0;
  const newShares = oldShares + input.intent.quantity;
  await deps.holdings.upsert({
    userId: input.intent.userId,
    propertyId: input.intent.propertyId,
    sharesOwned: newShares,
    avgCostUsd: nextAvgCostUsd(oldShares, oldAvg, input.intent.quantity, input.intent.priceUsdPerShare),
  });

  // Collectible NFT request — best-effort, fire-and-forget. It can NEVER throw into the
  // buy path or roll back the settlement; on failure the NFT goes pending/failed (retryable)
  // and the DB holding remains the authoritative ownership record.
  if (deps.nfts && deps.nftQueue) {
    try {
      await requestNftForHolding(
        {
          nfts: deps.nfts,
          queue: deps.nftQueue,
          users: deps.users ?? null,
          metadataBaseUrl: deps.nftMetadataBaseUrl,
          collectionAddress: deps.nftCollectionAddress ?? null,
          audit: deps.audit ?? null,
          log: deps.log,
        },
        {
          userId: input.intent.userId,
          propertyId: input.intent.propertyId,
          paidByWallet: input.intent.paidByWallet,
        },
      );
    } catch (err) {
      deps.log?.warn(
        { intentId: input.intent.id, err },
        "nft.request.failed_buy_unaffected",
      );
    }
  }

  const isUsdt = input.intent.currency === "USDT";
  const tonAmount = isUsdt
    ? null
    : Number(input.actualAmountNano ?? input.intent.expectedNanoTon ?? "0");
  const tokenAmount = isUsdt
    ? Number(input.actualJettonAmount ?? input.intent.expectedJettonAmount ?? "0")
    : null;
  await deps.transactions.insert({
    id: `tx_${input.intent.id}`,
    userId: input.intent.userId,
    kind: "buy",
    propertyId: input.intent.propertyId,
    shares: input.intent.quantity,
    // Principal only — the commission is FractionalLuxe revenue, recorded separately.
    amountUsd: input.intent.totalUsd,
    currency: isUsdt ? "USDT" : "TON",
    tonAmount,
    tokenAmount,
    status: "success",
    txHash: input.intent.txHash,
    buyIntentId: input.intent.id,
    // Primary-market commission (FractionalLuxe revenue) — the buyer paid principal + fee.
    feeUsd: input.intent.feeUsd ?? 0,
  });

  return { ok: true, ...(soldOut ? { soldOut: true } : {}) };
}
