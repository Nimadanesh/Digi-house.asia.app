import { eq } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { users, type UserRow } from "../db/schema/users.js";
import {
  toUserPublic,
  type TelegramProfileInput,
  type UserPublic,
} from "./user-public.js";

export type UserStore = {
  upsertFromTelegram(input: TelegramProfileInput): Promise<UserPublic>;
  findById(id: string): Promise<UserPublic | null>;
};

export function createDbUserStore(db: Db): UserStore {
  return {
    async upsertFromTelegram(input) {
      const now = new Date();
      const rows = await db
        .insert(users)
        .values({
          id: input.userId,
          displayName: input.displayName,
          username: input.username ?? null,
          photoUrl: input.photoUrl ?? null,
          role: "investor",
          walletAddress: null,
          onboarded: false,
          useTelegramTheme: false,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            displayName: input.displayName,
            username: input.username ?? null,
            photoUrl: input.photoUrl ?? null,
            updatedAt: now,
            // do not clobber role, onboarded, walletAddress, useTelegramTheme
          },
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("upsert returned no row");
      return toUserPublic(row);
    },

    async findById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const row = rows[0];
      return row ? toUserPublic(row) : null;
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryUserStore(
  seed: UserRow[] = [],
): UserStore & { _rows: Map<string, UserRow> } {
  const map = new Map<string, UserRow>(seed.map((r) => [r.id, { ...r }]));
  return {
    _rows: map,
    async upsertFromTelegram(input) {
      const now = new Date();
      const existing = map.get(input.userId);
      if (!existing) {
        const row: UserRow = {
          id: input.userId,
          displayName: input.displayName,
          username: input.username ?? null,
          photoUrl: input.photoUrl ?? null,
          role: "investor",
          walletAddress: null,
          onboarded: false,
          useTelegramTheme: false,
          createdAt: now,
          updatedAt: now,
        };
        map.set(input.userId, row);
        return toUserPublic(row);
      }
      const updated: UserRow = {
        ...existing,
        displayName: input.displayName,
        username: input.username ?? null,
        photoUrl: input.photoUrl ?? null,
        updatedAt: now,
      };
      map.set(input.userId, updated);
      return toUserPublic(updated);
    },
    async findById(id) {
      const row = map.get(id);
      return row ? toUserPublic(row) : null;
    },
  };
}
