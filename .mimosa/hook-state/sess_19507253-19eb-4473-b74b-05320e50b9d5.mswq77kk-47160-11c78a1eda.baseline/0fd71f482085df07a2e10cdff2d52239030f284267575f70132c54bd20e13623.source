// File responsibility: TON address parsing/validation/formatting. Wraps @ton/core Address; pure functions only.
// Components never import this directly — they go through useTonConnect (which uses shortAddress for chips).
import { Address } from "@ton/core";

export type AddressKind = "bounceable" | "nonBounceable" | "invalid";

/** Parse any TON address form (friendly E/U/k/0 or raw workchain:hash). Returns null on garbage. */
export function parseAddress(input: string): Address | null {
  if (!input || typeof input !== "string") return null;
  try {
    return Address.parse(input);
  } catch {
    return null;
  }
}

export function isValidAddress(input: string): boolean {
  return parseAddress(input) !== null;
}

/** Format an address to its user-friendly (base64url) form. Defaults: bounceable, urlSafe, not test-only. */
export function toUserFriendly(
  input: string | Address,
  opts: { bounceable?: boolean; testOnly?: boolean } = {},
): string {
  const addr = typeof input === "string" ? parseAddress(input) : input;
  if (!addr) return "";
  return addr.toString({
    bounceable: opts.bounceable ?? true,
    urlSafe: true,
    testOnly: opts.testOnly ?? false,
  });
}

/** Return the raw `workchain:hex` form, or "" on garbage. */
export function toRaw(input: string | Address): string {
  const addr = typeof input === "string" ? parseAddress(input) : input;
  return addr ? addr.toRawString() : "";
}

/** Shorten a long address to `prefix…suffix`. Strings shorter than prefix+suffix+1 are returned unchanged. */
export function shortAddress(
  input: string,
  opts: { prefix?: number; suffix?: number } = {},
): string {
  if (!input) return "";
  const prefix = opts.prefix ?? 4;
  const suffix = opts.suffix ?? 4;
  if (input.length <= prefix + suffix + 1) return input;
  return `${input.slice(0, prefix)}…${input.slice(-suffix)}`;
}

/** Classify a friendly address as bounceable / nonBounceable / invalid via @ton/core parseFriendly. */
export function addressKind(input: string): AddressKind {
  if (!input || typeof input !== "string") return "invalid";
  try {
    const { isBounceable } = Address.parseFriendly(input);
    return isBounceable ? "bounceable" : "nonBounceable";
  } catch {
    return "invalid";
  }
}