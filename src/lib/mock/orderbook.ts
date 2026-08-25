// File responsibility: OrderBookRepo mock impl. Placed orders live in module state so
// the demo book reflects them; deterministic synthetic fills give the trades list.
import type { OrderBookRepo } from "@/lib/api/repos";
import type { Order, OrderSide, Trade } from "@/types/order";
import { getCurrentSharePrice } from "@/lib/property-price";
import { seed } from "./seed";
import { PROPERTIES } from "./seed/properties";
import { sleep, jitter } from "./sleep";

/** Live demo orders (module state so the book reacts to placements). */
const placed: Order[] = [];

function bookFromPlaced(propertyId: string) {
  const seedBook = seed.orderBooks.find((b) => b.propertyId === propertyId);
  const bids = new Map<number, { quantity: number }>();
  const asks = new Map<number, { quantity: number }>();
  const add = (map: Map<number, { quantity: number }>, level: { priceUsd: number; quantity: number }) => {
    const cur = map.get(level.priceUsd);
    if (cur) cur.quantity += level.quantity;
    else map.set(level.priceUsd, { quantity: level.quantity });
  };
  for (const level of [...(seedBook?.bids ?? [])]) add(bids, level);
  for (const level of [...(seedBook?.asks ?? [])]) add(asks, level);
  // Placed orders join the VISIBLE DEPTH so the book reflects them, but they must
  // never define bestBid/bestAsk — a single user's resting limit order is not the
  // market price and must not move the page-wide source of truth.
  for (const o of placed) {
    if (o.propertyId !== propertyId || o.status !== "open") continue;
    const remaining = o.quantity - o.filledQuantity;
    if (remaining <= 0) continue;
    add(o.side === "buy" ? bids : asks, { priceUsd: o.priceUsd, quantity: remaining });
  }
  const toLevelsDesc = (m: Map<number, { quantity: number }>) => {
    let cum = 0;
    return [...m.entries()]
      .map(([priceUsd, v]) => ({ priceUsd, quantity: v.quantity }))
      .sort((a, b) => b.priceUsd - a.priceUsd)
      .map((l) => ({ ...l, cumulative: (cum += l.quantity) }));
  };
  const bidLevels = toLevelsDesc(bids);
  let cum = 0;
  const askLevels = [...asks.entries()]
    .map(([priceUsd, v]) => ({ priceUsd, quantity: v.quantity }))
    .sort((a, b) => a.priceUsd - b.priceUsd)
    .map((l) => ({ ...l, cumulative: (cum += l.quantity) }));
  // Best prices come from the STANDING market (seeded book) only — user orders excluded.
  const seedBids = seedBook?.bids?.map((l) => l.priceUsd) ?? [];
  const seedAsks = seedBook?.asks?.map((l) => l.priceUsd) ?? [];
  return {
    propertyId,
    bids: bidLevels,
    asks: askLevels,
    ...(seedBids.length > 0 ? { bestBidUsd: Math.max(...seedBids) } : {}),
    ...(seedAsks.length > 0 ? { bestAskUsd: Math.min(...seedAsks) } : {}),
  };
}

/** Deterministic synthetic fills for the demo trades list. */
function syntheticTrades(propertyId: string): Trade[] {
  const property = PROPERTIES.find((p) => p.id === propertyId);
  // Centre of mass = the same current price the rest of the UI shows
  // (lib/property-price hierarchy) — trades must not contradict it.
  const base = property
    ? getCurrentSharePrice(property)
    : 10_000;
  return [0, 1, 2, 3].map((i) => {
    const drift = (i % 2 === 0 ? 1 : -1) * ((base / 240) | 0 || 50) * (i + 1);
    return {
      id: `trd-demo-${propertyId}-${i}`,
      propertyId,
      priceUsd: base + drift,
      quantity: 2 + ((i * 3) % 7),
      buyFeeUsd: 0,
      sellFeeUsd: 0,
      createdAt: new Date(Date.now() - (i + 1) * 3_600_000).toISOString(),
    };
  });
}

export function MockOrderBookRepo(): OrderBookRepo {
  return {
    async get(propertyId: string) {
      await sleep(jitter());
      return bookFromPlaced(propertyId);
    },
    async placeOrder(input: {
      propertyId: string;
      side: OrderSide;
      priceUsd: number;
      quantity: number;
    }) {
      await sleep(jitter());
      const property = PROPERTIES.find((p) => p.id === input.propertyId);
      // §0.3: custom sells on a funding property queue until the primary sells out.
      const queued =
        input.side === "sell" && property?.status === "funding";
      const o: Order = {
        id: `ord-${Date.now()}`,
        propertyId: input.propertyId,
        makerAddress: seed.user.walletAddress ?? "",
        side: input.side,
        priceUsd: input.priceUsd,
        quantity: input.quantity,
        filledQuantity: 0,
        status: queued ? "queued" : "open",
        createdAt: new Date().toISOString(),
      };
      placed.push(o);
      return { ...o };
    },
    async cancelOrder(orderId: string) {
      void orderId;
      await sleep(jitter());
      const row = placed.find((o) => o.id === orderId);
      if (row) row.status = "cancelled";
    },
    async trades(propertyId: string) {
      await sleep(jitter());
      const live = syntheticTrades(propertyId);
      // newest first (synthetic list already is)
      return live;
    },
  };
}
