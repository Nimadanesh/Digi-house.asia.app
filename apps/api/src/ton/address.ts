// File responsibility: TON address canonicalization (raw `workchain:hex` form) for on-chain verification.
// No @ton/core dependency in the API — decodes friendly base64url addresses (CRC-checked) and normalizes
// raw addresses. Pure functions only.

const RAW_RE = /^(-?\d+):([0-9a-fA-F]{64})$/;

/** CRC-16/CCITT (init 0xffff) — the TON friendly-address checksum. */
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

/**
 * Canonicalize a TON address (raw `wc:hash`, friendly base64url E/U/k forms, padded or not)
 * to `workchain:hash` (lowercase hex). Returns null for garbage / failed CRC.
 * Used to compare the prepare-time destination with the on-chain recipient regardless of
 * bounceable/testnet formatting.
 */
export function canonicalTonAddress(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  if (s.length === 0) return null;

  const raw = RAW_RE.exec(s);
  if (raw) {
    const wc = raw[1];
    const hash = raw[2];
    if (wc === undefined || hash === undefined) return null;
    return `${wc}:${hash.toLowerCase()}`;
  }

  // Friendly form: base64url 36 bytes = [tag, wc, hash(32), crc(2)]. Buffer.from is tolerant
  // of base64 padding and of the url-safe alphabet after translating `-_`.
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(b64)) return null;
  let buf: Buffer;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return null;
  }
  if (buf.length !== 36) return null;

  const crc = crc16(buf.subarray(0, 34));
  if (crc[0] !== buf[34] || crc[1] !== buf[35]) return null;

  const wcByte = buf[1];
  if (wcByte === undefined) return null;
  const wc = wcByte & 0x80 ? wcByte - 0x100 : wcByte;
  return `${wc}:${buf.subarray(2, 34).toString("hex")}`;
}
