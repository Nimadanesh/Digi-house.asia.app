export const LAUNCH_NOT_ALLOWLISTED = "launch_not_allowlisted";

export type LaunchMode = "allowlist" | "open";

export function parseAllowlist(raw: string | undefined): Set<string> {
  if (!raw || raw.trim() === "") return new Set();
  const items = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  return new Set(items);
}

export function isAllowed(
  addressOrUserId: string,
  allowlist: Set<string>,
  mode: LaunchMode,
): boolean {
  if (mode === "open") return true;
  if (!addressOrUserId) return false;
  return allowlist.has(addressOrUserId.trim().toLowerCase());
}
