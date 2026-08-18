// File responsibility: verify a USDT (Jetton) buy payment on-chain against the prepare-time
// expectations. A Jetton payment spans multiple transactions, so we locate the high-level
// JettonTransfer action in the TonAPI event trace and check master, recipient and amount.
// Pure orchestration over TonTxClient + canonicalTonAddress; never touches stores/DB. The caller
// maps reasons to user-visible settlement statuses.
import { canonicalTonAddress } from "./address.js";
import type { TonTxClient } from "./tx-client.js";

export type VerifyJettonPaymentInput = {
  /** Wallet-signed message hash (from confirm). */
  txHash: string;
  /** USDT jetton master contract address (token identity). */
  expectedJettonMasterAddress: string;
  /** Receive wallet returned by prepare (admin USDT wallet). */
  expectedRecipientAddress: string;
  /** Minimum payable jetton amount in base units (USDT has 6 decimals). */
  expectedAmount: bigint;
  /** The connected wallet the transfer must originate from (the payer). Optional — skipped when unset. */
  expectedPayerWallet?: string;
  /** Reference "now" for the recency window (tests inject a fixed value). */
  referenceTimeMs?: number;
  /** Max age of the transfer; default 30 minutes. */
  maxAgeMs?: number;
};

export type VerifyJettonFailureReason =
  | "tx_not_found" // not indexed/processed yet → retryable
  | "api_unavailable" // transport/API error → retryable
  | "tx_failed" // source transaction or transfer action bounced/failed
  | "tx_too_old" // outside the recency window
  | "no_jetton_transfer" // no JettonTransfer action in the trace
  | "jetton_mismatch" // transferred a token other than the expected master
  | "recipient_mismatch" // funds did not reach the expected admin wallet
  | "amount_insufficient" // transferred less than expected
  | "payer_mismatch"; // did not originate from the connected (session) wallet's jetton wallet

export type VerifyJettonPaymentResult =
  | { valid: true; actualJettonAmount: string }
  | { valid: false; reason: VerifyJettonFailureReason; actualJettonAmount?: string };

export const JETTON_DEFAULT_MAX_AGE_MS = 30 * 60 * 1000;

export async function verifyJettonBuyPayment(
  client: TonTxClient,
  input: VerifyJettonPaymentInput,
): Promise<VerifyJettonPaymentResult> {
  // 1) The wallet-signed message must have produced a successful transaction (the message to the
  //    user's jetton wallet originates from the user's wallet).
  const lookup = await client.getTransactionByMessageHash(input.txHash);
  if (lookup.kind === "error") return { valid: false, reason: "api_unavailable" };
  if (lookup.kind === "not_found") return { valid: false, reason: "tx_not_found" };

  const tx = lookup.tx;
  if (!tx.success) return { valid: false, reason: "tx_failed" };

  // 2) The event trace for that transaction must contain a JettonTransfer action.
  const event = await client.getJettonTransfer(tx.hash);
  if (event.kind === "error") return { valid: false, reason: "api_unavailable" };
  if (event.kind === "not_found") return { valid: false, reason: "no_jetton_transfer" };

  const transfer = event.transfer;
  if (transfer.status === "failed") return { valid: false, reason: "tx_failed" };

  const referenceMs = input.referenceTimeMs ?? Date.now();
  const maxAgeMs = input.maxAgeMs ?? JETTON_DEFAULT_MAX_AGE_MS;
  if (transfer.utime > 0 && referenceMs - transfer.utime * 1000 > maxAgeMs) {
    return { valid: false, reason: "tx_too_old" };
  }

  // 3) Token identity: the jetton master must be the configured USDT master (guards against fake
  //    jettons with a matching name/symbol).
  const master = transfer.jettonMasterAddress
    ? canonicalTonAddress(transfer.jettonMasterAddress)
    : null;
  const expectedMaster = canonicalTonAddress(input.expectedJettonMasterAddress);
  if (!master || !expectedMaster || master !== expectedMaster) {
    return { valid: false, reason: "jetton_mismatch" };
  }

  // 4) Destination: the transfer must credit the admin USDT wallet (recipient = the account owner,
  //    NOT its jetton wallet contract).
  const recipient = transfer.recipientAddress
    ? canonicalTonAddress(transfer.recipientAddress)
    : null;
  const expectedRecipient = canonicalTonAddress(input.expectedRecipientAddress);
  if (!recipient || !expectedRecipient || recipient !== expectedRecipient) {
    return { valid: false, reason: "recipient_mismatch" };
  }

  // 5) Payer: the transfer must originate from the sender's jetton wallet derived from the connected
  //    (session) wallet. Only enforced when the intent recorded a payer; fail closed when unknown.
  if (input.expectedPayerWallet) {
    const jettonWallet = await client.getJettonWalletAddress(
      input.expectedJettonMasterAddress,
      input.expectedPayerWallet,
    );
    if (jettonWallet.kind !== "found") return { valid: false, reason: "api_unavailable" };
    const expectedSender = canonicalTonAddress(jettonWallet.address);
    const sender = transfer.senderWalletAddress
      ? canonicalTonAddress(transfer.senderWalletAddress)
      : null;
    if (!sender || !expectedSender || sender !== expectedSender) {
      return { valid: false, reason: "payer_mismatch" };
    }
  }

  // 6) Amount: transferred jetton base units must cover the intent's expected amount.
  let amount = 0n;
  try {
    amount = BigInt(transfer.amount);
  } catch {
    amount = 0n;
  }
  if (amount < input.expectedAmount) {
    return { valid: false, reason: "amount_insufficient", actualJettonAmount: transfer.amount };
  }
  return { valid: true, actualJettonAmount: transfer.amount };
}
