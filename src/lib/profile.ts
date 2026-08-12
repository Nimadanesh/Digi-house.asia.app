// File responsibility: client-side recovery code + phone helpers (mirror API rules).

export function normalizeRecoveryCodeInput(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "")
    .replace(/[–—]/g, "-");
}

export function isValidRecoveryCodeFormat(input: string): boolean {
  return /^DH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalizeRecoveryCodeInput(input));
}

export function normalizeDisplayNameInput(raw: string): string | null {
  const t = raw.trim().replace(/\s+/g, " ");
  if (t.length < 2 || t.length > 64) return null;
  return t;
}

export function normalizePhoneInput(raw: string): string | null | "invalid" {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const compact = trimmed.replace(/[\s().-]/g, "");
  if (!/^\+?[0-9]{7,15}$/.test(compact)) return "invalid";
  return compact.startsWith("+") ? compact : `+${compact}`;
}
