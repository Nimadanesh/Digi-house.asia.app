"use client";
// File responsibility: the Buy mutation. Coordinates the backend-returned amount/destination with the
// real TonConnect send, records the payment against the intent, polls the verify-and-settle endpoint
// (shares are ONLY issued after on-chain verification), and invalidates dependent screens.
// Toast/haptic side-effects stay in the calling component (page) via onSuccess/onError callbacks
// AND via the mutation's own onError for failed-TX states (R-7.5).
import { useState } from "react";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { useTonConnect } from "@/hooks/useTonConnect";
import { getRepo } from "@/lib/api/getRepo";
import { ApiError } from "@/lib/api/http/client";
import type { SendTxResult } from "@/types/ton";
import type { BuyCurrency, BuyVerifyResult } from "@/types/buy";

export interface BuyInput {
  propertyId: string;
  quantity: number;
  priceUsdPerShare: number;
  /** Payment rail: native TON (default) or USDT (Jetton). */
  currency: BuyCurrency;
}

/**
 * Thrown by the mutation when prepare fails because the server does not have USDT configured
 * (HTTP 409 / payment_method_unavailable). The caller switches back to TON and informs the user.
 */
export class UsdtUnavailableError extends Error {
  constructor() {
    super("USDT payments aren't available right now.");
    this.name = "UsdtUnavailableError";
  }
}

export type BuyPhase = "idle" | "sending" | "verifying";

const VERIFY_POLL_MS = 3000;
const VERIFY_MAX_ATTEMPTS = 10;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/** Human-readable copy for a final (non-retryable) verification failure reason. */
const VERIFY_FAILURE_COPY: Record<string, string> = {
  tx_failed: "The blockchain rejected this transaction — no shares were issued.",
  tx_too_old: "This payment was made too long ago to settle — please try again.",
  destination_mismatch: "The payment didn't reach the expected wallet — no shares were issued.",
  amount_insufficient: "The payment amount was less than expected — no shares were issued.",
  jetton_mismatch: "A different token was sent — USDT was expected.",
  recipient_mismatch: "The USDT didn't reach the expected wallet — no shares were issued.",
  no_jetton_transfer: "No USDT transfer was found on-chain — no shares were issued.",
  payer_mismatch: "The payment didn't come from your connected wallet — no shares were issued.",
};

function verificationFailedMessage(reason?: string): string {
  if (reason && VERIFY_FAILURE_COPY[reason]) return VERIFY_FAILURE_COPY[reason]!;
  return "Payment verification failed — your shares were not issued.";
}

/** Poll the backend until the payment is verified + settled, a final failure is returned, or we give up. */
export async function pollVerifyAndSettle(intentId: string): Promise<BuyVerifyResult> {
  let last: BuyVerifyResult | null = null;
  for (let attempt = 0; attempt < VERIFY_MAX_ATTEMPTS; attempt++) {
    last = await getRepo().tx.verifyAndSettle(intentId);
    if (last.status !== "pending_confirmation") break;
    await sleep(VERIFY_POLL_MS);
  }
  if (last?.status === "verification_failed") {
    throw new Error(verificationFailedMessage(last.reason));
  }
  if (!last || last.status !== "settled") {
    throw new Error(
      "Still confirming on the blockchain — your shares will appear in Portfolio once verified. No action needed.",
    );
  }
  return last;
}

export type UseBuySharesResult = UseMutationResult<SendTxResult, Error, BuyInput, unknown> & {
  phase: BuyPhase;
};

export function useBuyShares(): UseBuySharesResult {
  const ton = useTonConnect();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<BuyPhase>("idle");

  const mutation = useMutation<SendTxResult, Error, BuyInput>({
    mutationFn: async (input: BuyInput): Promise<SendTxResult> => {
      // 1) Prepare: backend returns the exact TonConnect message (admin destination + amount for TON,
      //    or the buyer's jetton wallet + jetton_transfer payload for USDT) + the intent to settle.
      let prep;
      try {
        prep = await getRepo().tx.prepareBuy({
          propertyId: input.propertyId,
          quantity: input.quantity,
          priceUsdPerShare: input.priceUsdPerShare,
          currency: input.currency,
        });
      } catch (e) {
        if (input.currency === "USDT" && e instanceof ApiError && e.code === "payment_method_unavailable") {
          throw new UsdtUnavailableError();
        }
        throw e;
      }
      // 2) Send the prepared message verbatim via TonConnect → real txHash. For USDT the payload
      //    carries the jetton_transfer body; for TON the memo is used as a plain comment.
      setPhase("sending");
      const sendResult: SendTxResult = await ton.send({
        toFriendlyAddress: prep.message.address,
        nanoTon: BigInt(prep.message.amount),
        ...(prep.message.payload ? { payload: prep.message.payload } : {}),
        memo: `buy ${input.quantity} shares of ${input.propertyId}`,
      });
      if (!sendResult.ok) throw new Error(sendResult.error ?? "wallet rejected the transaction");
      // 3) Record the payment against the intent.
      setPhase("verifying");
      await getRepo().tx.confirmBuy({
        intentId: prep.intentId,
        txHash: sendResult.txHash,
      });
      // 4) Verify on-chain + settle. Shares are issued ONLY after verification passes.
      await pollVerifyAndSettle(prep.intentId);
      return sendResult;
    },
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: ["portfolio"] });
      qc.invalidateQueries({ queryKey: ["earnings"] });
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      qc.invalidateQueries({ queryKey: ["property", input.propertyId] });
      qc.invalidateQueries({ queryKey: ["orderBook", input.propertyId] });
    },
    onSettled: () => setPhase("idle"),
    // onError is handled by the caller (page) for the toast + haptic — keep the hook free of UI side-effects.
  });

  return { ...mutation, phase };
}
