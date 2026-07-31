// File responsibility: verify a native-TON buy payment on-chain against the prepare-time expectations.
// Pure orchestration over TonTxClient + canonicalTonAddress; never touches stores/DB. The caller maps
// reasons to user-visible settlement statuses.
import { canonicalTonAddress } from "./address.js";
import type { TonTxClient } from "./tx-client.js";

export type VerifyBuyPaymentInput = {
  /** Wallet-signed message hash (from confirm). */
  txHash: string;
  /** Receive address returned by prepare (admin wallet / relay / owner). */
  expectedDestinationAddress: string;
  /** Minimum payable nanoTON stored on the intent. */
  expectedAmountNano: bigint;
  /** The connected wallet the payment must originate from (the payer). Optional — skipped when unset. */
  expectedPayerWallet?: string;
  /** Reference "now" for the recency window (tests inject a fixed value). */
  referenceTimeMs?: number;
  /** Max age of the transaction; default 30 minutes. */
  maxAgeMs?: number;
};

export type VerifyFailureReason =
  | "tx_not_found" // not indexed/processed yet → retryable
  | "api_unavailable" // transport/API error → retryable
  | "tx_failed" // transaction aborted/bounced
  | "tx_too_old" // outside the recency window
  | "destination_mismatch" // funds did not go to the expected receive address
  | "amount_insufficient" // transferred less than expected
  | "payer_mismatch"; // did not originate from the connected (session) wallet

export type VerifyBuyPaymentResult =
  | { valid: true; actualAmountNano: string }
  | { valid: false; reason: VerifyFailureReason; actualAmountNano?: string };

export const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;

export async function verifyBuyPayment(
  client: TonTxClient,
  input: VerifyBuyPaymentInput,
): Promise<VerifyBuyPaymentResult> {
  const lookup = await client.getTransactionByMessageHash(input.txHash);
  if (lookup.kind === "error") return { valid: false, reason: "api_unavailable" };
  if (lookup.kind === "not_found") return { valid: false, reason: "tx_not_found" };

  const tx = lookup.tx;
  if (!tx.success) return { valid: false, reason: "tx_failed" };

  // Payer check: the tx must originate from the wallet that prepared the intent (the session wallet).
  // Only enforced when the intent recorded a payer wallet; fail closed when the account is missing.
  if (input.expectedPayerWallet) {
    const payer = tx.accountAddress ? canonicalTonAddress(tx.accountAddress) : null;
    const expectedPayer = canonicalTonAddress(input.expectedPayerWallet);
    if (!payer || !expectedPayer || payer !== expectedPayer) {
      return { valid: false, reason: "payer_mismatch" };
    }
  }

  const referenceMs = input.referenceTimeMs ?? Date.now();
  const maxAgeMs = input.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  if (referenceMs - tx.utime * 1000 > maxAgeMs) {
    return { valid: false, reason: "tx_too_old" };
  }

  const expected = canonicalTonAddress(input.expectedDestinationAddress);
  const match = tx.outMessages.find((m) => {
    if (!m.destinationAddress) return false;
    return expected !== null && canonicalTonAddress(m.destinationAddress) === expected;
  });
  if (!match) {
    const first = tx.outMessages[0];
    return {
      valid: false,
      reason: "destination_mismatch",
      actualAmountNano: first?.valueNano,
    };
  }

  let amount = 0n;
  if (match.valueNano !== undefined) {
    try {
      amount = BigInt(match.valueNano);
    } catch {
      amount = 0n;
    }
  }
  if (amount < input.expectedAmountNano) {
    return { valid: false, reason: "amount_insufficient", actualAmountNano: match.valueNano };
  }
  return { valid: true, actualAmountNano: match.valueNano ?? "0" };
}
