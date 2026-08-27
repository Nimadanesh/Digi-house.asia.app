// File responsibility: TxRepo mock impl (prepareBuy + confirmBuy for MVP).
// Mock keeps the optimistic in-memory settlement inside confirmBuy (holdings + a synthetic-txHash
// transaction) so Home/Portfolio/Earnings reflect the buy immediately. Real path (HTTP) defers
// settlement until on-chain verification — see docs/adr/ADR-005 + Step 2 payment hardening.
import type { TxRepo } from "@/lib/api/repos";
import type { Transaction } from "@/types/transaction";
import type { Listing } from "@/types/property";
import type { BuyPrepareResult, BuyVerifyResult } from "@/types/buy";
import { previewFeeUsd } from "@/types/fees";
import { seed } from "./seed";
import { PROPERTIES } from "./seed/properties";
import { DEFAULT_FEE_TIERS } from "./fees";
import { sleep, jitter } from "./sleep";
import { makeSyntheticTxHash } from "@/lib/ton/synthetic-tx";
import { estimateNanoTon, weeklyRent, projectedYield } from "@/lib/format";
import { TON_PRICE_USD_CENTS } from "@/lib/constants";

const INTENT_TTL_MS = 15 * 60 * 1000;
const intents: BuyPrepareResult[] = [];

export function MockTxRepo(): TxRepo {
  return {
    async listTransactions(opts = {}) {
      await sleep(jitter());
      const limit = Math.min(opts.limit ?? 50, 100);
      const offset = opts.offset ?? 0;
      const sorted = [...seed.transactions]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(offset, offset + limit);
      const hasMore = seed.transactions.length > offset + limit;
      return { transactions: sorted, hasMore };
    },
    async prepareBuy(input): Promise<BuyPrepareResult> {
      await sleep(jitter());
      const property: Listing | undefined = PROPERTIES.find((p) => p.id === input.propertyId)
        ?? seed.properties.find((p) => p.id === input.propertyId);
      if (!property) throw new Error(`MockTxRepo.prepareBuy: property not found: ${input.propertyId}`);

      const totalUsd = input.quantity * input.priceUsdPerShare;
      const currency = input.currency === "USDT" ? "USDT" : "TON";
      // Primary-market commission (approved model): the property Commission Card wins when
      // present; the mock has no cards, so the amount-based tier table is the fallback —
      // mirroring the API. The buyer pays principal + commission.
      const feeUsd = previewFeeUsd(DEFAULT_FEE_TIERS, totalUsd, "buy_primary") ?? 0;
      const totalPayableUsd = totalUsd + feeUsd;
      // The mock settles optimistically (no on-chain verification), so the USDT message is a
      // placeholder: gas-sized amount, no real jetton body. Mirrors the HTTP response shape.
      const message = currency === "USDT"
        ? { address: property.ownerWalletAddress, amount: "100000000", payload: null }
        : {
            address: property.ownerWalletAddress,
            amount: estimateNanoTon(totalPayableUsd, TON_PRICE_USD_CENTS).toString(),
            payload: null,
          };
      const intent: BuyPrepareResult = {
        intentId: `intent-${Date.now()}`,
        propertyId: input.propertyId,
        quantity: input.quantity,
        priceUsdPerShare: input.priceUsdPerShare,
        totalUsd,
        feeUsd,
        totalPayableUsd,
        currency,
        message,
        expiresAt: new Date(Date.now() + INTENT_TTL_MS).toISOString(),
      };
      intents.push(intent);
      return intent;
    },
    async confirmBuy(input) {
      await sleep(jitter());
      const intent = intents.find((i) => i.intentId === input.intentId);
      if (!intent) {
        throw new Error(`MockTxRepo.confirmBuy: intent not found: ${input.intentId}`);
      }
      const property: Listing | undefined = PROPERTIES.find((p) => p.id === intent.propertyId)
        ?? seed.properties.find((p) => p.id === intent.propertyId);
      if (!property) throw new Error(`MockTxRepo.confirmBuy: property not found: ${intent.propertyId}`);

      // 1. Mutate the investor's Holding for this property (create if first buy).
      const holding = seed.holdings.find((h) => h.propertyId === intent.propertyId);
      const newShares = (holding?.sharesOwned ?? 0) + intent.quantity;
      const newAvgCost = holding && holding.sharesOwned > 0
        ? Math.round((holding.avgCostUsd * holding.sharesOwned + intent.priceUsdPerShare * intent.quantity) / newShares)
        : intent.priceUsdPerShare;
      const newCurrentValue = newShares * property.sharePriceUsd;
      const newShareRatio = newShares / property.totalShares;
      const newPending = projectedYield(weeklyRent(property.annualRentUsd), newShares, property.totalShares);
      const updatedHolding = {
        propertyId: intent.propertyId,
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
        propertyId: intent.propertyId,
        userId: seed.user.id,
        shares: intent.quantity,
        amountUsd: intent.totalUsd,
        // Primary-market commission — FractionalLuxe revenue, separate from principal.
        ...(intent.feeUsd ? { feeUsd: intent.feeUsd } : {}),
        status: "success",
        txHash: makeSyntheticTxHash(),
        createdAt: new Date().toISOString(),
      };
      seed.transactions.push(tx);

      return { intentId: intent.intentId, status: "confirmed" };
    },
    async verifyAndSettle(intentId: string): Promise<BuyVerifyResult> {
      await sleep(jitter());
      const intent = intents.find((i) => i.intentId === intentId);
      if (!intent) {
        throw new Error(`MockTxRepo.verifyAndSettle: intent not found: ${intentId}`);
      }
      // The mock settles optimistically inside confirmBuy, so the payment is already "verified"
      // by the time the frontend polls. Mirrors the HTTP response shape for a settled buy.
      return { intentId, status: "settled", txHash: "simulated:mock" };
    },
  };
}
