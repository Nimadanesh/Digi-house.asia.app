import type { Db } from "../db/client.js";
import { waitlist } from "../db/schema/waitlist.js";

export type WaitlistSignupInput = {
  email: string;
  telegram?: string | null;
  propertyId?: string | null;
  utm?: string | null;
};

export type WaitlistStore = {
  /** Idempotent on email — returns false when the address already existed. */
  add(input: WaitlistSignupInput): Promise<boolean>;
};

function newId(): string {
  return `wl_${crypto.randomUUID()}`;
}

export function createDbWaitlistStore(db: Db): WaitlistStore {
  return {
    async add(input) {
      const rows = await db
        .insert(waitlist)
        .values({
          id: newId(),
          email: input.email,
          telegram: input.telegram ?? null,
          propertyId: input.propertyId ?? null,
          utm: input.utm ?? null,
        })
        .onConflictDoNothing({ target: waitlist.email })
        .returning({ id: waitlist.id });
      return rows.length > 0;
    },
  };
}

/** In-memory store for unit tests (no Postgres). */
export function createMemoryWaitlistStore(): WaitlistStore & {
  _rows: (WaitlistSignupInput & { id: string })[];
} {
  const _rows: (WaitlistSignupInput & { id: string })[] = [];
  const seen = new Set<string>();
  return {
    _rows,
    async add(input) {
      if (seen.has(input.email)) return false;
      seen.add(input.email);
      _rows.push({ id: newId(), ...input });
      return true;
    },
  };
}
