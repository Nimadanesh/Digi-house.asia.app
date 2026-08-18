// File responsibility: generate / normalize / validate human recovery codes (DH-XXXX-XXXX).
import { randomBytes } from "node:crypto";

/** Crockford-ish alphabet — no I/O/0/1. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateRecoveryCode(): string {
  const bytes = randomBytes(8);
  let a = "";
  let b = "";
  for (let i = 0; i < 4; i++) {
    a += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  for (let i = 4; i < 8; i++) {
    b += ALPHABET[bytes[i]! % ALPHABET.length]!;
  }
  return `DH-${a}-${b}`;
}

/** Uppercase, strip spaces, unify dashes. */
export function normalizeRecoveryCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "")
    .replace(/[–—]/g, "-");
}

/** Accepts generated alphabet codes and hex backfill (A–Z / 0–9). */
export function isValidRecoveryCodeFormat(input: string): boolean {
  const n = normalizeRecoveryCode(input);
  return /^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(n);
}
