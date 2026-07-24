// File responsibility: TonAPI.io HTTP implementation of TonApiClient (WebView-safe, no ADNL).
// Endpoints (testnet at https://testnet.tonapi.io, mainnet at https://tonapi.io):
//   GET /v2/blockchain/accounts/{address}     -> { balance } (nanoTON as decimal string)
//   GET /v2/blockchain/messages/{msgHash}     -> { status, info?: { hash? }, error? }
import type { TonApiClient } from "./client";
import type { TxStatusResult } from "@/types/ton";
import { tonApiBase } from "./network";

const TIMEOUT_MS = 8000;

async function tonApiFetch<T>(path: string): Promise<T | null> {
  if (typeof fetch !== "function") return null; // SSR / unsupported env: gracefully miss
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${tonApiBase()}${path}`, {
      signal: ctrl.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function createTonApiClient(): TonApiClient {
  return {
    async getTonBalance(userFriendlyAddress: string): Promise<bigint> {
      type R = { balance?: string };
      const r = await tonApiFetch<R>(
        `/v2/blockchain/accounts/${userFriendlyAddress}`,
      );
      if (!r?.balance) return 0n;
      try {
        return BigInt(r.balance);
      } catch {
        return 0n;
      }
    },

    async getTxStatus(inMessageHash: string): Promise<TxStatusResult> {
      type R = { status?: string; info?: { hash?: string }; error?: string };
      const r = await tonApiFetch<R>(
        `/v2/blockchain/messages/${inMessageHash}`,
      );
      if (!r) return { status: "pending", hash: inMessageHash };
      const status = (r.status ?? "").toLowerCase();
      if (status === "completed" || status === "ok") {
        return { status: "success", hash: r.info?.hash ?? inMessageHash };
      }
      if (status === "failed" || status === "rejected" || r.error) {
        return {
          status: "failed",
          hash: r.info?.hash,
          reason: r.error ?? (status || "unknown"),
        };
      }
      return { status: "pending", hash: inMessageHash };
    },
  };
}