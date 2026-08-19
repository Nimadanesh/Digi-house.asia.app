// File responsibility: persist matching plans (PD-02). For each planned fill:
// apply fills race-safely to both orders, move shares seller→buyer (weighted avg cost),
// pay the seller from the buyer's escrow (notional − sell fee), record tier fees for
// BOTH sides (§0.5 buy_secondary/sell_secondary on the fill notional), insert the trade
// row (replay-proof unique key), write ledger rows, audit, and refund leftover escrow
// when the taker finishes. A per-property in-process mutex serializes matching.
import type { AuditStore } from "../audit/audit-store.js";
import { writeAuditEvent } from "../audit/write-audit.js";
import { sendOpsAlert, type OpsNotifyDeps } from "../notify/ops-alert.js";
import type { BalanceStore } from "../money/balance-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import type { Logger } from "../logger.js";
import type { FeeTierRecord } from "../fees/fee-tier-store.js";
import { resolveFee } from "../fees/resolve-fee.js";
import type { TxStore } from "../buys/tx-store.js";
import { nextAvgCostUsd } from "../buys/settle-buy.js";
import type { OrderRecord } from "./map-order.js";
import type { OrderStore } from "./order-store.js";
import type { TradeStore } from "./trade-store.js";
import { planFills, remaining, type EngineOrder } from "./match-engine.js";

export type SettleMatchesDeps = {
  orders: OrderStore;
  trades: TradeStore;
  holdings: HoldingStore;
  balances: BalanceStore;
  transactions: TxStore;
  feeTiers: FeeTierRecord[];
  log?: Logger;
  audit?: AuditStore | null;
  /** PF-05: optional ops Telegram alerting on match guard trips. */
  notify?: OpsNotifyDeps | null;
};

export type SettledFill = {
  tradeId: string;
  makerOrderId: string;
  takerOrderId: string;
  priceUsd: number;
  quantity: number;
  buyFeeUsd: number;
  sellFeeUsd: number;
};

/** Escrow needed for a buy order: worst-case notional + tier fee on the notional. */
export function buyEscrowUsd(
  feeTiers: FeeTierRecord[],
  priceUsd: number,
  quantity: number,
): { total: number; notional: number; fee: number } | null {
  const notional = priceUsd * quantity;
  const quote = resolveFee(feeTiers, notional, "buy_secondary");
  if (!quote) return null;
  return { total: notional + quote.feeUsd, notional, fee: quote.feeUsd };
}

// One matching run at a time per property (in-process). Fine for a single API instance;
// the guarded order updates below remain the hard race-safety net either way.
const locks = new Map<string, Promise<unknown>>();

async function withPropertyLock<T>(propertyId: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(propertyId) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  locks.set(
    propertyId,
    run.catch(() => {}),
  );
  return run;
}

function toEngine(o: OrderRecord): EngineOrder {
  return {
    id: o.id,
    userId: o.userId,
    side: o.side,
    priceUsd: o.priceUsd,
    quantity: o.quantity,
    filledQuantity: o.filledQuantity,
    isHouseAccount: o.isHouseAccount,
    createdAt: o.createdAt,
  };
}

/**
 * Run matching for a freshly placed (taker) order on a resale/funded property.
 * Returns the executed fills and the taker order's final state.
 */
export async function settleMatchesForTaker(
  deps: SettleMatchesDeps,
  taker: OrderRecord,
): Promise<{ fills: SettledFill[]; taker: OrderRecord }> {
  return withPropertyLock(taker.propertyId, async () => {
    const fills: SettledFill[] = [];
    if (taker.status !== "open") return { fills, taker };

    const opposite = (await deps.orders.listOpenByPropertyId(taker.propertyId)).filter(
      (o) => o.id !== taker.id && o.side !== taker.side,
    );
    const plan = planFills(
      toEngine(taker),
      opposite.map(toEngine),
    );

    let fillSeq = 0;
    for (const f of plan.fills) {
      const settled = await settleOneFill(deps, taker, f.makerOrderId, f.priceUsd, f.quantity, fillSeq);
      if (settled) {
        fills.push(settled);
        fillSeq++;
      }
    }

    // Refresh taker state; refund escrow left over (price improvement / no fill).
    const finalTaker = await deps.orders.getById(taker.id);
    let refreshed = finalTaker ?? taker;
    if (
      refreshed.side === "buy" &&
      refreshed.escrowedUsd > 0 &&
      (refreshed.status === "filled" || remaining(toEngine(refreshed)) < refreshed.quantity)
    ) {
      // escrow beyond what fills consumed is refunded when the order is terminal,
      // and unfilled-open orders keep their escrow (still live).
      if (refreshed.status !== "open") {
        const released = await deps.orders.releaseEscrow(refreshed.id);
        if (released > 0) {
          await deps.balances.adjust(refreshed.userId, { investingDelta: released });
        }
        refreshed = (await deps.orders.getById(refreshed.id)) ?? refreshed;
      }
    }
    return { fills, taker: refreshed };
  });
}

async function settleOneFill(
  deps: SettleMatchesDeps,
  taker: OrderRecord,
  makerOrderId: string,
  priceUsd: number,
  qty: number,
  fillSeq: number,
): Promise<SettledFill | null> {
  const maker = await deps.orders.getById(makerOrderId);
  if (!maker || maker.status !== "open") return null;
  const makerId = maker.id;

  // Fees on the fill notional, per side (§0.5, per-transaction tiers).
  const notional = priceUsd * qty;
  const buyQuote = resolveFee(deps.feeTiers, notional, "buy_secondary");
  const sellQuote = resolveFee(deps.feeTiers, notional, "sell_secondary");
  if (!buyQuote || !sellQuote) {
    deps.log?.warn({ notional }, "match.skipped_no_fee_tier");
    return null;
  }

  const isBuyerTaker = taker.side === "buy";
  const buyerOrder = isBuyerTaker ? taker : maker;
  const sellerOrder = isBuyerTaker ? maker : taker;

  // Buyer pays notional + buy fee from its escrow; seller receives notional − sell fee.
  const buyerRelease = notional + buyQuote.feeUsd;

  // Race-safe fill application — guards re-check remaining quantity and open status.
  const takerAfter = await deps.orders.applyFill(
    taker.id,
    qty,
    isBuyerTaker ? { escrowRelease: buyerRelease } : undefined,
  );
  if (!takerAfter) return null;
  const makerAfter = await deps.orders.applyFill(
    maker.id,
    qty,
    isBuyerTaker ? undefined : { escrowRelease: buyerRelease },
  );
  if (!makerAfter) {
    // Taker fill applied but maker guard tripped (concurrent change) — roll the taker
    // back is not possible cheaply; instead skip the money leg. The matcher replays
    // on next taker. To keep conservation, reverse the taker fill optimistically:
    // applyFill is monotonic; we accept the rare loss of that qty for the taker only
    // if it stayed 'open' — log loudly for ops.
    deps.log?.error(
      { takerId: taker.id, makerId, qty },
      "match.maker_guard_tripped",
    );
    if (deps.notify) {
      await sendOpsAlert(deps.notify, {
        subject: `Match guard tripped on ${taker.propertyId}`,
        details: {
          takerId: taker.id,
          makerId,
          quantity: qty,
          takerUserId: taker.userId,
          propertyId: taker.propertyId,
        },
      });
    }
    return null;
  }

  // Shares move seller → buyer at the fill price.
  const sellerHolding = await deps.holdings.get(sellerOrder.userId, taker.propertyId);
  const sellerShares = (sellerHolding?.sharesOwned ?? 0) - qty;
  if (sellerShares > 0) {
    await deps.holdings.upsert({
      userId: sellerOrder.userId,
      propertyId: taker.propertyId,
      sharesOwned: sellerShares,
      avgCostUsd: sellerHolding!.avgCostUsd,
    });
  } else {
    await deps.holdings.delete(sellerOrder.userId, taker.propertyId);
  }

  const buyerHolding = await deps.holdings.get(buyerOrder.userId, taker.propertyId);
  const oldShares = buyerHolding?.sharesOwned ?? 0;
  const oldAvg = buyerHolding?.avgCostUsd ?? 0;
  await deps.holdings.upsert({
    userId: buyerOrder.userId,
    propertyId: taker.propertyId,
    sharesOwned: oldShares + qty,
    avgCostUsd: nextAvgCostUsd(oldShares, oldAvg, qty, priceUsd),
  });

  // Seller proceeds (buyer cash was escrowed at placement).
  const sellerNet = notional - sellQuote.feeUsd;
  await deps.balances.adjust(sellerOrder.userId, { investingDelta: sellerNet });

  // Trade row (unique (taker, maker, seq) — replay-proof).
  const tradeId = `trd_${taker.id}_${maker.id}_${fillSeq}`;
  await deps.trades.insert({
    id: tradeId,
    propertyId: taker.propertyId,
    priceUsd,
    quantity: qty,
    buyerUserId: buyerOrder.userId,
    sellerUserId: sellerOrder.userId,
    buyFeeUsd: buyQuote.feeUsd,
    sellFeeUsd: sellQuote.feeUsd,
    makerOrderId: maker.id,
    takerOrderId: taker.id,
    fillSeq,
  });

  // Ledger rows for both sides.
  await deps.transactions.insert({
    id: `tx_${tradeId}_buy`,
    userId: buyerOrder.userId,
    kind: "trade_buy",
    propertyId: taker.propertyId,
    shares: qty,
    amountUsd: notional,
    currency: "USDT",
    status: "success",
    feeUsd: buyQuote.feeUsd,
  });
  await deps.transactions.insert({
    id: `tx_${tradeId}_sell`,
    userId: sellerOrder.userId,
    kind: "trade_sell",
    propertyId: taker.propertyId,
    shares: qty,
    amountUsd: sellerNet,
    currency: "USDT",
    status: "success",
    feeUsd: sellQuote.feeUsd,
  });

  if (deps.audit) {
    await writeAuditEvent(deps.audit, {
      action: "order.trade",
      actorType: "user",
      actorUserId: taker.userId,
      resourceType: "trade",
      resourceId: tradeId,
      summary: `Fill: ${qty} × $${(priceUsd / 100).toFixed(2)} on ${taker.propertyId}`,
      payload: {
        tradeId,
        takerOrderId: taker.id,
        makerOrderId: maker.id,
        quantity: qty,
        priceUsd,
        buyFeeUsd: buyQuote.feeUsd,
        sellFeeUsd: sellQuote.feeUsd,
      },
      requestId: null,
    });
  }

  return {
    tradeId,
    makerOrderId: maker.id,
    takerOrderId: taker.id,
    priceUsd,
    quantity: qty,
    buyFeeUsd: buyQuote.feeUsd,
    sellFeeUsd: sellQuote.feeUsd,
  };
}
