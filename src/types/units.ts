// File responsibility: branded numeric types so cents / nanoTON / shares can't be mixed at the type level.
// Mirror of the helpers in DATA_MODELS.md §"Branded numeric helpers".
// MVP may use plain `number`/`bigint` where convenient, but domain boundaries SHOULD use these.

export type Usd = number & { __brand: "usd" }; // integer minor units (cents): 12500 = $125.00
export type NanoTon = bigint & { __brand: "nanoTon" }; // 1 TON = 1_000_000_000 nanoTON
export type Shares = number & { __brand: "shares" }; // integer share counts

/** Coerce a plain number to Usd cents (rounds). */
export const usd = (n: number): Usd => Math.round(n) as Usd;

/** Coerce a bigint to NanoTon. */
export const nanoTon = (n: bigint): NanoTon => BigInt(n) as NanoTon;

/** Coerce a plain number to Shares (floors). */
export const shares = (n: number): Shares => Math.floor(n) as Shares;