// File responsibility: OrderBookRepo mock impl.
import type { OrderBookRepo } from "@/lib/api/repos";
import type { Order, OrderSide } from "@/types/order";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";

export function MockOrderBookRepo(): OrderBookRepo {
  return {
    async get(propertyId: string) {
      await sleep(jitter());
      return (
        seed.orderBooks.find((b) => b.propertyId === propertyId) ?? {
          propertyId,
          bids: [],
          asks: [],
        }
      );
    },
    async placeOrder(input: {
      propertyId: string;
      side: OrderSide;
      priceUsd: number;
      quantity: number;
    }) {
      await sleep(jitter());
      const o: Order = {
        id: `ord-${Date.now()}`,
        propertyId: input.propertyId,
        makerAddress: seed.user.walletAddress ?? "",
        side: input.side,
        priceUsd: input.priceUsd,
        quantity: input.quantity,
        filledQuantity: 0,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      return o;
    },
    async cancelOrder(orderId: string) {
      void orderId;
      await sleep(jitter());
    },
  };
}