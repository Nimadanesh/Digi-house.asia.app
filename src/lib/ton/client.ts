// File responsibility: the READ-side TON data contract (balance + tx status).
// Both the real TonAPI HTTP impl and a future backend/mock can implement this.
// Swap-in point: replace createTonApiClient() with another impl and hooks stay unchanged.
import type { TxStatusResult } from "@/types/ton";

export interface TonApiClient {
  /** Read the nanoTON balance of a user-friendly TON address. Returns 0n on miss/error. */
  getTonBalance(userFriendlyAddress: string): Promise<bigint>;
  /** Poll the status of a transaction by its (in-)message hash. */
  getTxStatus(inMessageHash: string): Promise<TxStatusResult>;
}