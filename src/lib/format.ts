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

/** Annual rent / total property value as 0..1 ratio. 0 when value is 0. */
export function annualYieldRatio(annualRentUsdCents: number, totalValueUsdCents: number): number {
  return totalValueUsdCents > 0 ? annualRentUsdCents / totalValueUsdCents : 0;
}

/** floor(weeklyUsdCents * 52) — projected annual from weekly (display helper). */
export function annualFromWeekly(weeklyUsdCents: number): number {
  return weeklyUsdCents * 52;
}

/** Estimate nanoTON for a USD-cents total using a fixed (MVP) TON price. Real quote is post-MVP. */
export function estimateNanoTon(usdCents: number, tonUsdPriceCents: number): bigint {
  if (tonUsdPriceCents <= 0) return 0n;
  return BigInt(Math.floor((usdCents * 1_000_000_000) / tonUsdPriceCents));
}

/** Return "in Xd Yh" / "in Xh" / "in Xm" relative to the next Friday 00:00 UTC after now. */
export function payoutCountdown(nowMs: number): string {
  const { days, hours, minutes } = nextFridayParts(nowMs);
  if (days >= 1) return `in ${days}d ${hours}h`;
  if (hours >= 1) return `in ${hours}h`;
  return `in ${minutes}m`;
}

/** Long form for Home Next Payout card — "2 days 14 hours" / "14 hours" / "12 minutes". */
export function payoutCountdownLong(nowMs: number): string {
  const { days, hours, minutes } = nextFridayParts(nowMs);
  if (days >= 1) {
    const d = `${days} ${days === 1 ? "day" : "days"}`;
    const h = `${hours} ${hours === 1 ? "hour" : "hours"}`;
    return `${d} ${h}`;
  }
  if (hours >= 1) return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
}

export function nextFridayParts(nowMs: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date(nowMs);
  const day = now.getUTCDay();
  const daysUntilFri = (5 - day + 7) % 7;
  const nextFriMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFri, 0, 0, 0);
  let diffMs = nextFriMs - nowMs;
  if (diffMs <= 0) diffMs += 7 * 24 * 60 * 60 * 1000;
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86_400);
  const hours = Math.floor((totalSec % 86_400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return { days, hours, minutes, seconds };
}

/** Live home countdown — "2d - 14h - 30m - 05s". */
export function payoutCountdownDhms(nowMs: number): string {
  const { days, hours, minutes, seconds } = nextFridayParts(nowMs);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${days}d - ${hours}h - ${pad(minutes)}m - ${pad(seconds)}s`;
}