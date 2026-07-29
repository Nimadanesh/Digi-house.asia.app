import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { properties, type PropertyRow } from "../db/schema/properties.js";
import {
  mapPropertyToListing,
  type ListingPublic,
  type PropertyStatus,
} from "./map-listing.js";

export type ListMarketplaceFilter = {
  status?: PropertyStatus;
  query?: string;
};

export type PropertyStore = {
  list(filter?: ListMarketplaceFilter): Promise<ListingPublic[]>;
  getById(id: string): Promise<ListingPublic | null>;
  /** Batch fetch by IDs — single query. Returns empty Map for empty input. */
  getByIds(ids: string[]): Promise<Map<string, ListingPublic>>;
  /** Race-safe: true if shares_sold incremented; false if would exceed total. */
  tryIncrementSharesSold(id: string, qty: number): Promise<boolean>;
};

export function createDbPropertyStore(db: Db): PropertyStore {
  return {
    async list(filter = {}) {
      const clauses: SQL[] = [];
      if (filter.status) {
        clauses.push(eq(properties.status, filter.status));
      }
      const q = filter.query?.trim();
      if (q) {
        const pattern = `%${escapeIlike(q)}%`;
        clauses.push(
          or(
            ilike(properties.title, pattern),
            ilike(properties.location, pattern),
          )!,
        );
      }

      const rows =
        clauses.length === 0
          ? await db
              .select()
              .from(properties)
              .orderBy(desc(properties.createdAt))
          : await db
              .select()
              .from(properties)
              .where(and(...clauses))
              .orderBy(desc(properties.createdAt));

      return rows.map(mapPropertyToListing);
    },

    async getById(id) {
      const rows = await db
        .select()
        .from(properties)
        .where(eq(properties.id, id))
        .limit(1);
      const row = rows[0];
      return row ? mapPropertyToListing(row) : null;
    },

    async getByIds(ids) {
      if (ids.length === 0) return new Map();
      const rows = await db
        .select()
        .from(properties)
        .where(sql`${properties.id} IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`);
      const map = new Map<string, ListingPublic>();
      for (const row of rows) {
        map.set(row.id, mapPropertyToListing(row));
      }
      return map;
    },

    async tryIncrementSharesSold(id, qty) {
      if (qty <= 0) return false;
      const rows = await db
        .update(properties)
        .set({
          sharesSold: sql`${properties.sharesSold} + ${qty}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(properties.id, id),
            sql`${properties.sharesSold} + ${qty} <= ${properties.totalShares}`,
          ),
        )
        .returning({ id: properties.id });
      return rows.length > 0;
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryPropertyStore(
  seed: PropertyRow[],
): PropertyStore & { _rows: PropertyRow[] } {
  const rows = seed.map((r) => ({ ...r }));

  return {
    _rows: rows,

    async list(filter = {}) {
      let list = [...rows];
      if (filter.status) {
        list = list.filter((p) => p.status === filter.status);
      }
      const q = filter.query?.trim().toLowerCase();
      if (q) {
        list = list.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q),
        );
      }
      list.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
      );
      return list.map(mapPropertyToListing);
    },

    async getById(id) {
      const row = rows.find((p) => p.id === id);
      return row ? mapPropertyToListing(row) : null;
    },

    async getByIds(ids) {
      if (ids.length === 0) return new Map();
      const map = new Map<string, ListingPublic>();
      for (const row of rows) {
        if (ids.includes(row.id)) {
          map.set(row.id, mapPropertyToListing(row));
        }
      }
      return map;
    },

    async tryIncrementSharesSold(id, qty) {
      if (qty <= 0) return false;
      const row = rows.find((p) => p.id === id);
      if (!row) return false;
      if (row.sharesSold + qty > row.totalShares) return false;
      row.sharesSold += qty;
      row.updatedAt = new Date();
      return true;
    },
  };
}

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}
