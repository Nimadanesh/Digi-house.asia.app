// File responsibility: SellsRepo mock impl — mirrors the API instant-sell math
// (list price − 7%, shares return to supply, net credits investing).
import type { SellsRepo } from "@/lib/api/repos";
import { PROPERTIES } from "./seed/properties";
import { HOLDINGS } from "./seed/holdings";
import { sleep, jitter } from "./sleep";

export const MOCK_INSTANT_SELL_FEE_BPS = 700;

export function MockSellsRepo(): SellsRepo {
  return {
    async instant(input) {
      await sleep(jitter());
      const property = PROPERTIES.find((p) => p.id === input.propertyId);
      const holding = HOLDINGS.find((h) => h.propertyId === input.propertyId);
      if (!property || !holding) {
        throw new Error("Property or holding not found");
      }
      if (property.status !== "funding") {
        throw new Error("Instant sell is only available during the primary offering");
      }
      if (input.shares > holding.sharesOwned) {
        throw new Error(`Only ${holding.sharesOwned} share(s) available to sell`);
      }
      const grossUsd = input.shares * property.sharePriceUsd;
      const feeUsd = Math.floor((grossUsd * MOCK_INSTANT_SELL_FEE_BPS) / 10_000);
      const netUsd = grossUsd - feeUsd;
      holding.sharesOwned -= input.shares; // demo state mutation
      property.sharesSold -= input.shares;
      property.sharesRemaining += input.shares;
      return {
        id: `isell-mock-${Date.now()}`,
        propertyId: input.propertyId,
        shares: input.shares,
        grossUsd,
        feeUsd,
        netUsd,
        status: "settled",
        sharesRemaining: property.sharesRemaining,
        freeSharesAfter: Math.max(0, holding.sharesOwned - input.shares),
      };
    },
  };
}
