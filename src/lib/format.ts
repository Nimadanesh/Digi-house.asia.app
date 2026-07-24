// File responsibility: pure display formatters for money/TON/addresses/dates. No React, no DOM, no network.
// Money in = integer minor units (cents). TON in = nanoTON (bigint).

export function usd(minor: number): string {
  return `$${(minor / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function ton(nano: bigint): string {
  const n = Number(nano) / 1e9;
  const fixed = n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
  return `${fixed} TON`;
}

export function shortAddr(a: string, opts: { prefix?: number; suffix?: number } = {}): string {
  if (!a) return "";
  const prefix = opts.prefix ?? 4;
  const suffix = opts.suffix ?? 4;
  if (a.length <= prefix + suffix + 1) return a;
  return `${a.slice(0, prefix)}…${a.slice(-suffix)}`;
}

export function pct(ratio: number): string {
  return `${(ratio * 100).toFixed(ratio < 0.1 ? 1 : 0)}%`;
}

export function weekLabel(isoMonday: string): string {
  return new Date(isoMonday).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** floor(annualRentUsdCents / 52) — integer minor units. */
export function weeklyRent(annualRentUsdCents: number): number {
  return Math.floor(annualRentUsdCents / 52);
}

/** floor(weeklyRentUsdCents * sharesOwned / totalShares) — integer minor units. 0 when totalShares=0. */
export function projectedYield(weeklyRentUsdCents: number, sharesOwned: number, totalShares: number): number {
  return totalShares > 0 ? Math.floor(weeklyRentUsdCents * (sharesOwned / totalShares)) : 0;
}

/** Return "in Xd Yh" / "in Xh" / "in Xm" relative to the next Friday 00:00 UTC after now. */
export function payoutCountdown(nowMs: number, _opts?: { payoutDay?: "Friday" }): string {
  const now = new Date(nowMs);
  // ISO day: 5 = Friday (0 Sun..6 Sat). Find the next Friday 00:00 UTC strictly after now (rollover if already past).
  const day = now.getUTCDay();
  const daysUntilFri = (5 - day + 7) % 7;
  const nextFriMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFri, 0, 0, 0);
  let diffMs = nextFriMs - nowMs;
  if (diffMs <= 0) diffMs += 7 * 24 * 60 * 60 * 1000; // already Friday past midnight → next week
  const totalMin = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const minutes = totalMin % 60;
  if (days >= 1) return `in ${days}d ${hours}h`;
  if (hours >= 1) return `in ${hours}h`;
  return `in ${minutes}m`;
}