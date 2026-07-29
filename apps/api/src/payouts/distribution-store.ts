import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { earningsEntries } from "../db/schema/earnings-entries.js";
import { rentalDistributions } from "../db/schema/rental-distributions.js";

export type DistStatus = "scheduled" | "distributing" | "completed";

export type DistributionRecord = {
  id: string;
  propertyId: string;
  weekOf: string;
  rentPoolUsd: number;
  rentPoolNanoTon: number;
  payoutDay: string;
  status: DistStatus;
  totalShares: number;
  createdAt: Date;
};

export type DistributionStore = {
  getById(id: string): Promise<DistributionRecord | null>;
  /** scheduled|distributing that still have pending earnings entries. */
  listTickable(): Promise<DistributionRecord[]>;
  markCompleted(id: string): Promise<void>;
};

function mapStatus(s: string): DistStatus {
  if (s === "scheduled" || s === "distributing" || s === "completed") {
    return s;
  }
  return "scheduled";
}

function mapRow(r: {
  id: string;
  propertyId: string;
  weekOf: string;
  rentPoolUsd: number;
  rentPoolNanoTon: number;
  payoutDay: string;
  status: string;
  totalShares: number;
  createdAt: Date;
}): DistributionRecord {
  return {
    id: r.id,
    propertyId: r.propertyId,
    weekOf: r.weekOf,
    rentPoolUsd: Number(r.rentPoolUsd),
    rentPoolNanoTon: Number(r.rentPoolNanoTon),
    payoutDay: r.payoutDay,
    status: mapStatus(r.status),
    totalShares: r.totalShares,
    createdAt: r.createdAt,
  };
}

export function createDbDistributionStore(db: Db): DistributionStore {
  return {
    async getById(id) {
      const rows = await db
        .select()
        .from(rentalDistributions)
        .where(eq(rentalDistributions.id, id))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async listTickable() {
      const rows = await db
        .selectDistinctOn([rentalDistributions.id], {
          id: rentalDistributions.id,
          propertyId: rentalDistributions.propertyId,
          weekOf: rentalDistributions.weekOf,
          rentPoolUsd: rentalDistributions.rentPoolUsd,
          rentPoolNanoTon: rentalDistributions.rentPoolNanoTon,
          payoutDay: rentalDistributions.payoutDay,
          status: rentalDistributions.status,
          totalShares: rentalDistributions.totalShares,
          createdAt: rentalDistributions.createdAt,
        })
        .from(rentalDistributions)
        .innerJoin(
          earningsEntries,
          eq(earningsEntries.distributionId, rentalDistributions.id),
        )
        .where(
          and(
            sql`${rentalDistributions.status} IN ('scheduled', 'distributing')`,
            eq(earningsEntries.status, "pending"),
          ),
        );
      return rows.map(mapRow);
    },

    async markCompleted(id) {
      await db
        .update(rentalDistributions)
        .set({ status: "completed" })
        .where(
          and(
            eq(rentalDistributions.id, id),
            sql`${rentalDistributions.status} IN ('scheduled', 'distributing')`,
          ),
        );
    },
  };
}

/** In-memory store for unit tests. */
export function createMemoryDistributionStore(
  seed: DistributionRecord[] = [],
): DistributionStore & { _rows: DistributionRecord[] } {
  const rows = seed.map((r) => ({ ...r }));
  return {
    _rows: rows,

    async getById(id) {
      const row = rows.find((r) => r.id === id);
      return row ? { ...row } : null;
    },

    async listTickable() {
      // Caller (tickPayoutDue) filters by pending via earnings store —
      // return non-completed open statuses; tick core re-checks pending.
      return rows
        .filter(
          (r) => r.status === "scheduled" || r.status === "distributing",
        )
        .map((r) => ({ ...r }));
    },

    async markCompleted(id) {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx < 0) return;
      const cur = rows[idx]!;
      if (cur.status === "scheduled" || cur.status === "distributing") {
        rows[idx] = { ...cur, status: "completed" };
      }
    },
  };
}
