// File responsibility: synthetic MVP tx hash helper (no TonConnect imports).
// Mock seed/repos import this — never pull @tonconnect/* into the data path.

const SYNTHETIC_PREFIX = "simulated:";

/** Produce a synthetic placeholder tx hash ("simulated:<uuid>"). MVP never returns a real on-chain hash. */
export function makeSyntheticTxHash(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${SYNTHETIC_PREFIX}${id}`;
}
