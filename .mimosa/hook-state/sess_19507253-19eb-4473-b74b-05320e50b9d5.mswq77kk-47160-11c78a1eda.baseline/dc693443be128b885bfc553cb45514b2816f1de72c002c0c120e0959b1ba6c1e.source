import { eq, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { users, type UserRow } from "../db/schema/users.js";
import {
  generateRecoveryCode,
  isValidRecoveryCodeFormat,
  normalizeRecoveryCode,
} from "./recovery-code.js";
import {
  toUserPublic,
  type TelegramProfileInput,
  type UpdateProfileInput,
  type UserPublic,
} from "./user-public.js";

const CODE_ATTEMPTS = 8;

export type UserStore = {
  upsertFromTelegram(input: TelegramProfileInput): Promise<UserPublic>;
  findById(id: string): Promise<UserPublic | null>;
  markOnboarded(id: string): Promise<UserPublic | null>;
  updateProfile(id: string, input: UpdateProfileInput): Promise<UserPublic | null>;
  /** Owner-only: plaintext recovery code, ensuring one exists. */
  getRecoveryCode(id: string): Promise<string | null>;
  /** Lookup by recovery code for recovery login. */
  findByRecoveryCode(code: string): Promise<UserPublic | null>;
  /** Ensure recovery code exists (backfill). Returns public user. */
  ensureRecoveryCode(id: string): Promise<UserPublic | null>;
};

async function allocateRecoveryCode(
  exists: (code: string) => Promise<boolean>,
): Promise<string> {
  for (let i = 0; i < CODE_ATTEMPTS; i++) {
    const code = generateRecoveryCode();
    if (!(await exists(code))) return code;
  }
  throw new Error("failed to allocate unique recovery code");
}

export function createDbUserStore(db: Db): UserStore {
  return {
    async upsertFromTelegram(input) {
      const now = new Date();
      const recoveryCode = await allocateRecoveryCode(async (code) => {
        const rows = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.recoveryCode, code))
          .limit(1);
        return rows.length > 0;
      });

      const rows = await db
        .insert(users)
        .values({
          id: input.userId,
          displayName: input.displayName,
          username: input.username ?? null,
          photoUrl: input.photoUrl ?? null,
          role: "investor",
          walletAddress: null,
          phone: null,
          recoveryCode,
          recoveryCodeCreatedAt: now,
          profileCompletedAt: null,
          onboarded: false,
          useTelegramTheme: false,
          referredByUserId: input.referredByUserId ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            displayName: input.displayName,
            username: input.username ?? null,
            photoUrl: input.photoUrl ?? null,
            referredByUserId:
              sql`CASE WHEN ${users.referredByUserId} IS NULL THEN ${input.referredByUserId ?? null} ELSE ${users.referredByUserId} END`,
            // Backfill recovery code if missing (do not rotate existing)
            recoveryCode: sql`COALESCE(${users.recoveryCode}, ${recoveryCode})`,
            recoveryCodeCreatedAt: sql`COALESCE(${users.recoveryCodeCreatedAt}, ${now})`,
            updatedAt: now,
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

    async markOnboarded(id) {
      const now = new Date();
      const rows = await db
        .update(users)
        .set({ onboarded: true, updatedAt: now })
        .where(eq(users.id, id))
        .returning();
      const row = rows[0];
      return row ? toUserPublic(row) : null;
    },

    async updateProfile(id, input) {
      const now = new Date();
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const cur = existing[0];
      if (!cur) return null;

      const nextDisplay =
        input.displayName !== undefined ? input.displayName : cur.displayName;
      const nextPhone =
        input.phone !== undefined ? input.phone : cur.phone;
      const nextCompleted =
        input.completeProfile && !cur.profileCompletedAt
          ? now
          : cur.profileCompletedAt;

      const rows = await db
        .update(users)
        .set({
          displayName: nextDisplay,
          phone: nextPhone,
          profileCompletedAt: nextCompleted,
          updatedAt: now,
        })
        .where(eq(users.id, id))
        .returning();
      const row = rows[0];
      return row ? toUserPublic(row) : null;
    },

    async getRecoveryCode(id) {
      await this.ensureRecoveryCode(id);
      const rows = await db
        .select({ recoveryCode: users.recoveryCode })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return rows[0]?.recoveryCode ?? null;
    },

    async findByRecoveryCode(code) {
      if (!isValidRecoveryCodeFormat(code)) return null;
      const normalized = normalizeRecoveryCode(code);
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.recoveryCode, normalized))
        .limit(1);
      const row = rows[0];
      return row ? toUserPublic(row) : null;
    },

    async ensureRecoveryCode(id) {
      const existing = await db.select().from(users).where(eq(users.id, id)).limit(1);
      const cur = existing[0];
      if (!cur) return null;
      if (cur.recoveryCode) return toUserPublic(cur);

      const now = new Date();
      for (let i = 0; i < CODE_ATTEMPTS; i++) {
        const code = generateRecoveryCode();
        try {
          const rows = await db
            .update(users)
            .set({
              recoveryCode: code,
              recoveryCodeCreatedAt: now,
              updatedAt: now,
            })
            .where(eq(users.id, id))
            .returning();
          const row = rows[0];
          if (row) return toUserPublic(row);
        } catch {
          // unique collision — retry
        }
      }
      throw new Error("failed to allocate unique recovery code");
    },
  };
}

function blankRow(partial: Partial<UserRow> & Pick<UserRow, "id" | "displayName">): UserRow {
  const now = new Date();
  return {
    id: partial.id,
    displayName: partial.displayName,
    username: partial.username ?? null,
    photoUrl: partial.photoUrl ?? null,
    role: partial.role ?? "investor",
    walletAddress: partial.walletAddress ?? null,
    phone: partial.phone ?? null,
    recoveryCode: partial.recoveryCode ?? null,
    recoveryCodeCreatedAt: partial.recoveryCodeCreatedAt ?? null,
    profileCompletedAt: partial.profileCompletedAt ?? null,
    onboarded: partial.onboarded ?? false,
    useTelegramTheme: partial.useTelegramTheme ?? false,
    referredByUserId: partial.referredByUserId ?? null,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryUserStore(
  seed: Array<Partial<UserRow> & Pick<UserRow, "id" | "displayName">> = [],
): UserStore & { _rows: Map<string, UserRow> } {
  const map = new Map<string, UserRow>(
    seed.map((r) => [r.id, blankRow(r)]),
  );

  async function codeTaken(code: string, exceptId?: string): Promise<boolean> {
    for (const row of map.values()) {
      if (row.recoveryCode === code && row.id !== exceptId) return true;
    }
    return false;
  }

  return {
    _rows: map,
    async upsertFromTelegram(input) {
      const now = new Date();
      const existing = map.get(input.userId);
      if (!existing) {
        const recoveryCode = await allocateRecoveryCode((c) => codeTaken(c));
        const row = blankRow({
          id: input.userId,
          displayName: input.displayName,
          username: input.username ?? null,
          photoUrl: input.photoUrl ?? null,
          recoveryCode,
          recoveryCodeCreatedAt: now,
          referredByUserId: input.referredByUserId ?? null,
          createdAt: now,
          updatedAt: now,
        });
        map.set(input.userId, row);
        return toUserPublic(row);
      }
      let recoveryCode = existing.recoveryCode;
      let recoveryCodeCreatedAt = existing.recoveryCodeCreatedAt;
      if (!recoveryCode) {
        recoveryCode = await allocateRecoveryCode((c) => codeTaken(c, existing.id));
        recoveryCodeCreatedAt = now;
      }
      const updated = blankRow({
        ...existing,
        displayName: input.displayName,
        username: input.username ?? null,
        photoUrl: input.photoUrl ?? null,
        referredByUserId:
          existing.referredByUserId ?? (input.referredByUserId ?? null),
        recoveryCode,
        recoveryCodeCreatedAt,
        updatedAt: now,
      });
      map.set(input.userId, updated);
      return toUserPublic(updated);
    },
    async findById(id) {
      const row = map.get(id);
      return row ? toUserPublic(row) : null;
    },
    async markOnboarded(id) {
      const existing = map.get(id);
      if (!existing) return null;
      const updated = blankRow({
        ...existing,
        onboarded: true,
        updatedAt: new Date(),
      });
      map.set(id, updated);
      return toUserPublic(updated);
    },
    async updateProfile(id, input) {
      const existing = map.get(id);
      if (!existing) return null;
      const now = new Date();
      const updated = blankRow({
        ...existing,
        displayName:
          input.displayName !== undefined ? input.displayName : existing.displayName,
        phone: input.phone !== undefined ? input.phone : existing.phone,
        profileCompletedAt:
          input.completeProfile && !existing.profileCompletedAt
            ? now
            : existing.profileCompletedAt,
        updatedAt: now,
      });
      map.set(id, updated);
      return toUserPublic(updated);
    },
    async getRecoveryCode(id) {
      await this.ensureRecoveryCode(id);
      return map.get(id)?.recoveryCode ?? null;
    },
    async findByRecoveryCode(code) {
      if (!isValidRecoveryCodeFormat(code)) return null;
      const normalized = normalizeRecoveryCode(code);
      for (const row of map.values()) {
        if (row.recoveryCode === normalized) return toUserPublic(row);
      }
      return null;
    },
    async ensureRecoveryCode(id) {
      const existing = map.get(id);
      if (!existing) return null;
      if (existing.recoveryCode) return toUserPublic(existing);
      const now = new Date();
      const recoveryCode = await allocateRecoveryCode((c) => codeTaken(c, id));
      const updated = blankRow({
        ...existing,
        recoveryCode,
        recoveryCodeCreatedAt: now,
        updatedAt: now,
      });
      map.set(id, updated);
      return toUserPublic(updated);
    },
  };
}
