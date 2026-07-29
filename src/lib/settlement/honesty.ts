// File responsibility: ADR-001 §4 honesty gate helpers.
// Pure functions — no React, no hooks, no side-effects.
// Explorer URL templates: Tonviewer (testnet/mainnet).

import type { TonNetwork } from "@/lib/env";

const TX_HASH_SIMULATED_PREFIX = "simulated:";

const EXPLORER_TEMPLATES: Record<TonNetwork, string> = {
  testnet: "https://testnet.tonviewer.com/transaction/{hash}",
  mainnet: "https://tonviewer.com/transaction/{hash}",
};

export function isRealTxHash(txHash: string | undefined | null): boolean {
  if (!txHash) return false;
  return !txHash.startsWith(TX_HASH_SIMULATED_PREFIX);
}

export function buildExplorerTxUrl(
  txHash: string,
  network: TonNetwork,
): string | null {
  if (!isRealTxHash(txHash)) return null;
  return EXPLORER_TEMPLATES[network].replace("{hash}", txHash);
}

export function canShowExplorerLink(
  txHash: string | undefined | null,
  network: TonNetwork,
): boolean {
  if (!txHash) return false;
  if (!isRealTxHash(txHash)) return false;
  return buildExplorerTxUrl(txHash, network) !== null;
}

export function shouldShowSimulatedBadge(
  txHash: string | undefined | null,
  status: string,
  network: TonNetwork,
): boolean {
  if (status !== "paid") return false;
  if (!txHash) return true;
  if (isRealTxHash(txHash) && canShowExplorerLink(txHash, network)) return false;
  return true;
}
