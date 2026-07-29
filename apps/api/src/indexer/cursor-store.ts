import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { indexerCursors } from "../db/schema/chain-events.js";

export type CursorRow = {
  contractAddress: string;
  eventType: "jetton_transfer" | "distribution_claim" | "distribution_funded";
  cursor: number;
  lastSeenLt: number | null;
  lastTxHash: string | null;
  updatedAt: Date;
};

export type CursorStore = {
  getOrInit(
    contractAddress: string,
    eventType: CursorRow["eventType"],
  ): Promise<CursorRow>;
  advance(
    contractAddress: string,
    eventType: CursorRow["eventType"],
    cursor: number,
    lastSeenLt: number,
    lastTxHash: string,
  ): Promise<void>;
  listAll(): Promise<CursorRow[]>;
};

function mapRow(r: {
  contractAddress: string;
  eventType: string;
  cursor: number;
  lastSeenLt: number | null;
  lastTxHash: string | null;
  updatedAt: Date;
}): CursorRow {
  return {
    contractAddress: r.contractAddress,
    eventType: r.eventType as CursorRow["eventType"],
    cursor: Number(r.cursor),
    lastSeenLt: r.lastSeenLt,
    lastTxHash: r.lastTxHash,
    updatedAt: r.updatedAt,
  };
}

export function createDbCursorStore(db: Db): CursorStore {
  return {
    async getOrInit(contractAddress, eventType) {
      const rows = await db
        .select()
        .from(indexerCursors)
        .where(eq(indexerCursors.contractAddress, contractAddress))
        .limit(1);
      if (rows.length > 0) {
        return mapRow(rows[0]!);
      }
      const now = new Date();
      await db.insert(indexerCursors).values({
        contractAddress,
        eventType,
        cursor: 0,
        lastSeenLt: null,
        lastTxHash: null,
        updatedAt: now,
      });
      return {
        contractAddress,
        eventType,
        cursor: 0,
        lastSeenLt: null,
        lastTxHash: null,
        updatedAt: now,
      };
    },

    async advance(contractAddress, eventType, cursor, lastSeenLt, lastTxHash) {
      await db
        .update(indexerCursors)
        .set({
          cursor,
          lastSeenLt,
          lastTxHash,
          updatedAt: new Date(),
        })
        .where(eq(indexerCursors.contractAddress, contractAddress));
    },

    async listAll() {
      const rows = await db.select().from(indexerCursors);
      return rows.map(mapRow);
    },
  };
}

export function createMemoryCursorStore(
  seed: CursorRow[] = [],
): CursorStore & { _rows: CursorRow[] } {
  const rows = seed.map((r) => ({ ...r }));
  return {
    _rows: rows,
    async getOrInit(contractAddress, eventType) {
      const found = rows.find((r) => r.contractAddress === contractAddress);
      if (found) return { ...found };
      const row: CursorRow = {
        contractAddress,
        eventType,
        cursor: 0,
        lastSeenLt: null,
        lastTxHash: null,
        updatedAt: new Date(),
      };
      rows.push(row);
      return { ...row };
    },
    async advance(contractAddress, _eventType, cursor, lastSeenLt, lastTxHash) {
      const idx = rows.findIndex((r) => r.contractAddress === contractAddress);
      if (idx < 0) return;
      rows[idx] = {
        ...rows[idx]!,
        cursor,
        lastSeenLt,
        lastTxHash,
        updatedAt: new Date(),
      };
    },
    async listAll() {
      return rows.map((r) => ({ ...r }));
    },
  };
}
