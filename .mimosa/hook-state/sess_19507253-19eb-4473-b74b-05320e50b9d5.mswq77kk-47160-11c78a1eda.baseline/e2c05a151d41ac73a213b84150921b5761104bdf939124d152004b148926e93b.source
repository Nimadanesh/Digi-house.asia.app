// File responsibility: lenient phone + display name validation for profile PATCH.
export function normalizeDisplayName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const t = raw.trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 64) return null;
  return t;
}

/**
 * Optional phone. Empty → null. Accepts +, spaces, dashes.
 * Digits length 7–15 (E.164-ish, lenient).
 */
export function normalizePhone(raw: unknown): { ok: true; phone: string | null } | { ok: false } {
  if (raw === undefined || raw === null) return { ok: true, phone: null };
  if (typeof raw !== "string") return { ok: false };
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, phone: null };
  const compact = trimmed.replace(/[\s().-]/g, "");
  if (!/^\+?[0-9]{7,15}$/.test(compact)) return { ok: false };
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return { ok: false };
  return { ok: true, phone: compact.startsWith("+") ? compact : `+${compact}` };
}
