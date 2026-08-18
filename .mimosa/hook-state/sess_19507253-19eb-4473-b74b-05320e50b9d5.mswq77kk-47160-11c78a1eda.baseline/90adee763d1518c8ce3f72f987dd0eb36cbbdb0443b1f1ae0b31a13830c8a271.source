export type EarningsEntryInput = {
  id: string;
  userId: string;
  propertyId: string;
  weekOf: string | Date;
  amountUsd: number;
  tonAmount: number;
  shareRatio: number;
  status: "paid" | "pending";
  txHash: string | null;
};

export type EarningsEntryPublic = {
  id: string;
  userId: string;
  propertyId: string;
  weekOf: string;
  amountUsd: number;
  tonAmount: number;
  shareRatio: number;
  status: "paid" | "pending";
  txHash?: string;
};

export type EarningsSummaryPublic = {
  allTimeUsd: number;
  thisWeekProjectedUsd: number;
  projectedNextWeekUsd: number;
  entries: EarningsEntryPublic[];
};

/** Monday midnight UTC — matches Mini App mock WEEKS (`YYYY-MM-DDTHH:mm:ssZ`). */
export function formatWeekOf(weekOf: string | Date): string {
  if (weekOf instanceof Date) {
    const y = weekOf.getUTCFullYear();
    const m = String(weekOf.getUTCMonth() + 1).padStart(2, "0");
    const d = String(weekOf.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}T00:00:00Z`;
  }
  const s = weekOf.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T00:00:00Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    return s.endsWith("Z") ? s : `${s.replace(/Z?$/, "")}Z`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return formatWeekOf(d);
  }
  return s;
}

export function buildEarningsSummary(
  rows: EarningsEntryInput[],
): EarningsSummaryPublic {
  const entries: EarningsEntryPublic[] = rows.map((r) => {
    const entry: EarningsEntryPublic = {
      id: r.id,
      userId: r.userId,
      propertyId: r.propertyId,
      weekOf: formatWeekOf(r.weekOf),
      amountUsd: Number(r.amountUsd),
      tonAmount: Number(r.tonAmount),
      shareRatio: r.shareRatio,
      status: r.status === "paid" ? "paid" : "pending",
    };
    if (r.txHash) {
      entry.txHash = r.txHash;
    }
    return entry;
  });

  entries.sort((a, b) => {
    const w = b.weekOf.localeCompare(a.weekOf);
    if (w !== 0) return w;
    return a.propertyId.localeCompare(b.propertyId);
  });

  const allTimeUsd = entries
    .filter((e) => e.status === "paid")
    .reduce((s, e) => s + e.amountUsd, 0);
  const thisWeekProjectedUsd = entries
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + e.amountUsd, 0);

  return {
    allTimeUsd,
    thisWeekProjectedUsd,
    projectedNextWeekUsd: thisWeekProjectedUsd,
    entries,
  };
}
