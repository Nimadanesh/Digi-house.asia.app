// File responsibility: SellsRepo mock impl — mirrors the API instant-sell math
// (canonical base price − 7%, shares return to the demo ledger, net credits investing).
import type { SellsRepo } from "@/lib/api/repos";
import type { Transaction } from "@/types/transaction";
import { PROPERTIES } from "./seed/properties";
import { HOLDINGS } from "./seed/holdings";
import { seed } from "./seed";
import { CANONICAL_BASE_PRICE_USD } from "@/lib/economics/canonical-offering";
import { demoSoldShares, getCanonicalListing } from "./canonical-listing";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
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
      // Instant buyback at the canonical $100 base price − 7% (never a fixture price).
      const grossUsd = input.shares * CANONICAL_BASE_PRICE_USD;
      const feeUsd = Math.floor((grossUsd * MOCK_INSTANT_SELL_FEE_BPS) / 10_000);
      const netUsd = grossUsd - feeUsd;
      holding.sharesOwned -= input.shares; // demo state mutation
      // Sold/remaining are ledger-derived (canonical-listing) — no fixture mutation.
      const canonical = getCanonicalListing(input.propertyId);
      const canonicalTotal = canonical?.totalShares ?? property.totalShares;
      const remaining = Math.max(0, canonicalTotal - demoSoldShares(input.propertyId));
      // Slice 5: the sale lands in the transaction ledger like buys do — the
      // action is visible on every surface (no silent success).
      const sellTx: Transaction = {
        id: `tx-${Date.now()}`,
        kind: "instant_sell",
        propertyId: input.propertyId,
        userId: seed.user.id,
        shares: input.shares,
        amountUsd: netUsd,
        feeUsd,
        status: "success",
        txHash: makeSyntheticTxHash(),
        createdAt: new Date().toISOString(),
      };
      seed.transactions.push(sellTx);
      return {
        id: `isell-mock-${Date.now()}`,
        propertyId: input.propertyId,
        shares: input.shares,
        grossUsd,
        feeUsd,
        netUsd,
        status: "settled",
        sharesRemaining: remaining,
        // Exact post-sale remainder — holding.sharesOwned already reflects the
        // decrement above (previously subtracted twice).
        freeSharesAfter: Math.max(0, holding.sharesOwned),
      };
    },
  };
}
