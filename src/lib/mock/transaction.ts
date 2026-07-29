// File responsibility: TxRepo mock impl (buy only for MVP). Hardens the buy mutation to also
// persist into the in-memory seed (holdings + transactions) so Home/Portfolio/Earnings reflect
// the buy immediately after the synthetic TX returns ok.
import type { TxRepo } from "@/lib/api/repos";
import type { Transaction } from "@/types/transaction";
import type { Listing } from "@/types/property";
import { seed } from "./seed";
import { PROPERTIES } from "./seed/properties";
import { sleep, jitter } from "./sleep";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
import { weeklyRent, projectedYield } from "@/lib/format";

export function MockTxRepo(): TxRepo {
  return {
    async buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }) {
      await sleep(jitter());
      const property: Listing | undefined = PROPERTIES.find((p) => p.id === input.propertyId)
        ?? seed.properties.find((p) => p.id === input.propertyId);
      if (!property) throw new Error(`MockTxRepo.buy: property not found: ${input.propertyId}`);

      // 1. Mutate the investor's Holding for this property (create if first buy).
      const holding = seed.holdings.find((h) => h.propertyId === input.propertyId);
      const newShares = (holding?.sharesOwned ?? 0) + input.quantity;
      const newAvgCost = holding && holding.sharesOwned > 0
        ? Math.round((holding.avgCostUsd * holding.sharesOwned + input.priceUsdPerShare * input.quantity) / newShares)
        : input.priceUsdPerShare;
      const newCurrentValue = newShares * property.sharePriceUsd;
      const newShareRatio = newShares / property.totalShares;
      const newPending = projectedYield(weeklyRent(property.annualRentUsd), newShares, property.totalShares);
      const updatedHolding = {
        propertyId: input.propertyId,
        sharesOwned: newShares,
        avgCostUsd: newAvgCost,
        currentValueUsd: newCurrentValue,
        pendingWeekEarningsUsd: newPending,
        shareRatio: newShareRatio,
      };
      if (holding) {
        // In-place mutation so existing references (TanStack cache, already-rendered screens) see the update.
        Object.assign(holding, updatedHolding);
      } else {
        seed.holdings.push(updatedHolding);
      }

      // 2. Push a new Transaction with synthetic txHash (MVP honesty contract).
      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        kind: "buy",
        propertyId: input.propertyId,
        userId: seed.user.id,
        shares: input.quantity,
        amountUsd: input.quantity * input.priceUsdPerShare,
        status: "success",
        txHash: makeSyntheticTxHash(),
        createdAt: new Date().toISOString(),
      };
      seed.transactions.push(tx);

      return tx;
    },
  };
}