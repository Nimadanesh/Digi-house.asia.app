// File responsibility: TxRepo mock impl (buy only for MVP).
import type { TxRepo } from "@/lib/api/repos";
import type { Transaction } from "@/types/transaction";
import { seed } from "./seed";
import { sleep, jitter } from "./sleep";
import { makeSyntheticTxHash } from "@/lib/ton/sendTx";

export function MockTxRepo(): TxRepo {
  return {
    async buy(input: { propertyId: string; quantity: number; priceUsdPerShare: number }) {
      await sleep(jitter());
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
      return tx;
    },
  };
}