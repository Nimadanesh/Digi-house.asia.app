// File responsibility: contract for looking up an on-chain transaction by the wallet-signed message hash.
// The HTTP implementation lives in tonapi-client.ts; tests inject a fake. Components/routes depend on this
// interface only.

export type OutMessage = {
  /** Recipient account address, in whatever form TonAPI returns it (canonicalized later). */
  destinationAddress?: string;
  /** Transferred value in nanoTON (decimal string). */
  valueNano?: string;
};

/** The account transaction that consumed the wallet-signed message. */
export type OnChainTx = {
  hash: string;
  /** Whether the transaction executed successfully (compute + action phases). */
  success: boolean;
  /** Unix seconds when the transaction was created. */
  utime: number;
  /** The account (wallet) that produced this transaction — the payer, if present. */
  accountAddress?: string;
  /** Outbound messages produced by the transaction (the transfer to the receive wallet). */
  outMessages: OutMessage[];
};

export type TxLookupResult =
  | { kind: "found"; tx: OnChainTx }
  /** Not on-chain yet (not indexed / not processed) — retryable. */
  | { kind: "not_found" }
  /** Transport/API failure — retryable, do NOT fail the payment on this alone. */
  | { kind: "error" };

/** A high-level Jetton transfer parsed from a TonAPI event trace (JettonTransferAction). */
export type OnChainJettonTransfer = {
  /** Whether the transfer action succeeded (vs bounced/failed). */
  status: "ok" | "failed";
  /** Jetton master contract address (the token identity — USDT master for us). */
  jettonMasterAddress?: string;
  /** The sender's jetton wallet contract that initiated the transfer (the payer's token wallet). */
  senderWalletAddress?: string;
  /** Receiving account address (the admin USDT wallet, NOT its jetton wallet contract). */
  recipientAddress?: string;
  /** Transferred amount in jetton base units (USDT has 6 decimals). */
  amount: string;
  /** Unix seconds when the event was produced. */
  utime: number;
};

export type JettonTransferLookupResult =
  | { kind: "found"; transfer: OnChainJettonTransfer }
  /** No JettonTransfer in the trace / not indexed yet — retryable. */
  | { kind: "not_found" }
  /** Transport/API failure — retryable. */
  | { kind: "error" };

export type JettonWalletLookupResult =
  | { kind: "found"; address: string }
  /** Transport/API failure — caller decides (non-retryable at prepare time). */
  | { kind: "error" };

export type TonTxClient = {
  /** Look up the transaction produced by the given message hash. */
  getTransactionByMessageHash(hash: string): Promise<TxLookupResult>;
  /**
   * Look up the Jetton transfer caused by the given transaction hash (via the event trace).
   * Used to verify USDT payments: master, recipient and amount are checked before settlement.
   */
  getJettonTransfer(hash: string): Promise<JettonTransferLookupResult>;
  /**
   * Derive a user's jetton wallet address for a master contract (get_wallet_address run method).
   * Prepares the Jetton TonConnect message that pays from that wallet.
   */
  getJettonWalletAddress(
    masterAddress: string,
    ownerAddress: string,
  ): Promise<JettonWalletLookupResult>;
};
