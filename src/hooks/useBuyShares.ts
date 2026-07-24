"use client";
// File responsibility: the Buy mutation. Sends a 0.01 TON testnet stub via useTonConnect; on success
// hardens via getRepo().tx.buy() and invalidates the screens that depend on the new holding.
// Toast/haptic side-effects stay in the calling component (page) via onSuccess/onError callbacks
// AND via the mutation's own onError for failed-TX states (R-7.5).
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useTonConnect } from "@/hooks/useTonConnect";
import { getRepo } from "@/lib/api/getRepo";
import { toNanoSafe } from "@/lib/ton/nano";
import type { SendTxResult } from "@/types/ton";

export interface BuyInput {
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  toFriendlyAddress: string;  // the property's ownerWalletAddress (user-friendly)
}

export function useBuyShares(): UseMutationResult<SendTxResult, Error, BuyInput, unknown> {
  const ton = useTonConnect();
  const qc = useQueryClient();

  return useMutation<SendTxResult, Error, BuyInput>({
    mutationFn: async (input: BuyInput): Promise<SendTxResult> => {
      // 1) Send the testnet 0.01 TON stub. (Phase 2 sendTx already builds + signs via TonConnect.)
      const sendResult: SendTxResult = await ton.send({
        toFriendlyAddress: input.toFriendlyAddress,
        nanoTon: toNanoSafe("0.01"),
        memo: `buy ${input.quantity} shares of ${input.propertyId}`,
      });
      if (!sendResult.ok) throw new Error(sendResult.error ?? "wallet rejected the transaction");
      // 2) Persist optimistically in-memory via the mock. Real TX is post-MVP — the seed records the intent.
      await getRepo().tx.buy({
        propertyId: input.propertyId,
        quantity: input.quantity,
        priceUsdPerShare: input.priceUsdPerShare,
      });
      return sendResult;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      qc.invalidateQueries({ queryKey: ["property", input.propertyId] });
      qc.invalidateQueries({ queryKey: ["orderBook", input.propertyId] });
    },
    // onError is handled by the caller (page) for the toast + haptic — keep the hook free of UI side-effects.
  });
}