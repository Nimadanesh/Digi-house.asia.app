import { describe, expect, it } from "vitest";
import { canonicalTonAddress } from "./address.js";

const ZERO_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const RAW = `0:${ZERO_HASH}`;

/** CRC-16/CCITT (init 0xffff), same as TON friendly-address checksum. */
function crc16(data: Uint8Array): Uint8Array {
  let crc = 0xffff;
  for (const byte of data) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return new Uint8Array([crc >> 8, crc & 0xff]);
}

/** Build a valid friendly TON address from a raw workchain:hash. */
function friendly(raw: string, bounceable: boolean, testOnly = false): string {
  const [, wc, hash] = /^(-?\d+):([0-9a-f]{64})$/.exec(raw)!;
  const tag = (bounceable ? 0x11 : 0x51) + (testOnly ? 0x80 : 0);
  const body = Buffer.alloc(34);
  body[0] = tag;
  body[1] = Number(wc ?? 0) & 0xff;
  body.set(Buffer.from(hash ?? "", "hex"), 2);
  const crc = crc16(body);
  const full = Buffer.concat([body, Buffer.from(crc)]);
  return full.toString("base64url");
}

describe("canonicalTonAddress", () => {
  it("passes through a raw workchain:hash unchanged", () => {
    expect(canonicalTonAddress(RAW)).toBe(RAW);
  });

  it("lowercases an uppercase raw hash", () => {
    const upper = `0:${ZERO_HASH.slice(0, 62)}AB`;
    expect(canonicalTonAddress(upper)).toBe(`0:${ZERO_HASH.slice(0, 62)}ab`);
  });

  it("decodes a bounceable friendly address to its raw form", () => {
    expect(canonicalTonAddress(friendly(RAW, true))).toBe(RAW);
  });

  it("decodes a non-bounceable friendly address to the same raw form", () => {
    expect(canonicalTonAddress(friendly(RAW, false))).toBe(RAW);
  });

  it("ignores the testnet flag when comparing (same raw)", () => {
    expect(canonicalTonAddress(friendly(RAW, true, true))).toBe(RAW);
  });

  it("accepts padded base64 form as well as url-safe unpadded", () => {
    const unpadded = friendly(RAW, true);
    const padded = `${unpadded}=`;
    expect(canonicalTonAddress(padded)).toBe(RAW);
  });

  it("returns null for garbage / empty input", () => {
    expect(canonicalTonAddress("")).toBeNull();
    expect(canonicalTonAddress("not-an-address")).toBeNull();
    expect(canonicalTonAddress("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBeNull();
  });

  it("distinguishes different hashes", () => {
    const other = `0:00000000000000000000000000000000000000000000000000000000000000ab`;
    expect(canonicalTonAddress(friendly(other, true))).toBe(other);
    expect(canonicalTonAddress(friendly(other, true))).not.toBe(RAW);
  });
});
