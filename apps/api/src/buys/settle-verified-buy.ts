// File responsibility: settle a verified buy — the single place that turns a verified payment into
// shares (increment shares_sold, upsert the holding, write the success ledger row). Only called after
// on-chain verification succeeded. Claim-then-write: markSettled is the atomic double-settlement guard.
import type { IntentStore, BuyIntentRecord } from "./intent-store.js";
import { nextAvgCostUsd } from "./settle-buy.js";
import type { TxStore } from "./tx-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";

export type SettleVerifiedBuyDeps = {
  intents: IntentStore;
  properties: PropertyStore;
  holdings: HoldingStore;
  transactions: TxStore;
};

export type SettleVerifiedBuyResult =
  | { ok: true; alreadySettled?: boolean }
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
    amountUsd: input.intent.totalUsd,
    currency: isUsdt ? "USDT" : "TON",
    tonAmount,
    tokenAmount,
    status: "success",
    txHash: input.intent.txHash,
    buyIntentId: input.intent.id,
  });

  return { ok: true };
}
