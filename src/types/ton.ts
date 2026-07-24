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
  /** MVP: a synthetic placeholder ("simulated:<id>"). Real on-chain hash is post-MVP. */
  txHash: string;
  /** Human-readable failure reason when ok=false. */
  error?: string;
}

export interface BuyMessageInput {
  /** User-friendly TON destination (the property owner's wallet or the relay). */
  toFriendlyAddress: string;
  /** Amount to send, in nanoTON. */
  nanoTon: NanoTon | bigint;
  /** Optional text comment (cell body). MVP attaches it as a plain payload. */
  memo?: string;
  /** Deadline in unix epoch seconds from now. Default 300. */
  validUntilSeconds?: number;
}