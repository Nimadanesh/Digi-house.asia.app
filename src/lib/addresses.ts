// File responsibility: payout-network vocabulary + loose client-side address checks.
// The API does the authoritative parse; these only gate obvious typos before submit.
export type PayoutNetwork =
  | "ton"
  | "ethereum"
  | "tron"
  | "bnb"
  | "polygon"
  | "arbitrum";

export const PAYOUT_NETWORKS: readonly PayoutNetwork[] = [
  "ethereum",
  "tron",
  "bnb",
  "polygon",
  "arbitrum",
  "ton",
];

/** Guess a network from the address shape (legacy plain-string entries). */
export function detectNetwork(address: string): PayoutNetwork {
  const s = address.trim();
  if (/^0x[0-9a-fA-F]{40}$/.test(s)) return "ethereum";
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s)) return "tron";
  return "ton";
}

/** Loose per-network shape check; false = certainly invalid. */
export function isValidAddressForNetwork(address: string, network: PayoutNetwork): boolean {
  const s = address.trim();
  switch (network) {
    case "ethereum":
    case "bnb":
    case "polygon":
    case "arbitrum":
      return /^0x[0-9a-fA-F]{40}$/.test(s);
    case "tron":
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s);
    case "ton":
      return (
        (s.startsWith("EQ") || s.startsWith("UQ") || s.startsWith("0:")) &&
        s.length >= 20
      );
  }
}
