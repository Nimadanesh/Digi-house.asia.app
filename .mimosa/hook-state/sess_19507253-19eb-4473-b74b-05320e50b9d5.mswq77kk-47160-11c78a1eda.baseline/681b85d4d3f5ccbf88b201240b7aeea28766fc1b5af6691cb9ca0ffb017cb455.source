import { createHash } from "node:crypto";

/**
 * Stable SHA-256 hex of canonical JSON (sorted object keys, recursive).
 * Never hash secrets/tokens — callers must pass redacted payloads only.
 */
export function hashAuditPayload(payload: unknown): string {
  const canonical = stableStringify(payload);
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    out[k] = sortKeys(obj[k]);
  }
  return out;
}
