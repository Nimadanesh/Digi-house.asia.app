// File responsibility: shared TON result/status types. Near-leaf (imports only branded units).
import type { NanoTon } from "@/types/units";

export type TxStatusResult =
  | { status: "pending"; hash: string }
  | { status: "success"; hash: string }
  | { status: "failed"; hash?: string; reason: string };

export interface SendTxResult {
  ok: boolean;
  /** Signed Bag-of-Cells returned by the wallet, when the user confirmed. */
  boc?: string;
  /**
   * Hash of the wallet-signed message on the PAYMENT path (real, hex). "simulated:…"
   * hashes are only produced by the mock/synthetic data path, never by sendTx.
   */
  txHash: string;
  /** Human-readable failure reason when ok=false. */
  error?: string;
}

export interface BuyMessageInput {
  /** User-friendly TON destination (admin receive wallet from /v1/buys/prepare, or the user's jetton wallet). */
  toFriendlyAddress: string;
  /** Amount to send, in nanoTON. */
  nanoTon: NanoTon | bigint;
  /** Optional text comment (cell body). MVP attaches it as a plain payload. */
  memo?: string;
  /**
   * Pre-built message body as a base64 BoC (the jetton_transfer for USDT payments).
   * When set, it takes precedence over `memo` — the wallet sends the raw body verbatim.
   */
  payload?: string | null;
  /** Deadline in unix epoch seconds from now. Default 300. */
  validUntilSeconds?: number;
}