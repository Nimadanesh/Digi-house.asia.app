// File responsibility: holding_nfts persistence (Phase 2). The NFT is a collectible
// receipt only — the DB holdings table stays the source of truth for ownership.
// Every status transition is a guarded single-statement UPDATE (claim-then-act) so a
// duplicate worker run or duplicate settlement event can never double-mint: at most one
// row per holding (UNIQUE holding_key), at most one pending→minting winner, etc.
import { and, asc, desc, eq, inArray, lt, sql } from "drizzle-orm";
import type { Db } from "../db/client.js";
import { holdingNfts } from "../db/schema/holding-nfts.js";

/** Minimal enqueue surface (structural) so the API/worker/admin can share one shape. */
export type NftQueueLike = {
  add(job: { name: string; data: { holdingNftId: string } }): Promise<unknown>;
};

export type NftStatus =
  | "pending"
  | "minting"
  | "minted"
  | "transferring"
  | "delivered"
  | "failed";

export type HoldingNftRecord = {
  id: string;
  /** `${userId}:${propertyId}` — the 1 holding → 1 NFT enforcement key. */
  holdingKey: string;
  userId: string;
  propertyId: string;
  walletAddress: string;
  collectionAddress: string | null;
  nftItemId: number | null;
  nftAddress: string | null;
  status: NftStatus;
  metadataUrl: string | null;
  mintTxHash: string | null;
  transferTxHash: string | null;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NewNftInput = {
  id: string;
  holdingKey: string;
  userId: string;
  propertyId: string;
  walletAddress: string;
  collectionAddress?: string | null;
  metadataUrl?: string | null;
};

export type NftStore = {
  /**
   * Insert the NFT record for a holding. Idempotent: a second insert for the same
   * holding (duplicate settlement event) returns { created: false } without changing
   * the existing row — the 1:1 rule is enforced by the unique constraint.
   */
  insert(input: NewNftInput): Promise<{ record: HoldingNftRecord; created: boolean }>;
  get(id: string): Promise<HoldingNftRecord | null>;
  listByUser(userId: string): Promise<HoldingNftRecord[]>;
  getByHolding(userId: string, propertyId: string): Promise<HoldingNftRecord | null>;
  /** Admin queue — newest first, optionally filtered by status. */
  listAll(opts?: { status?: NftStatus }): Promise<HoldingNftRecord[]>;
  /** pending → minting (guarded claim; null when already claimed). */
  claimForMint(id: string): Promise<HoldingNftRecord | null>;
  /** minting → minted with on-chain facts. */
  markMinted(
    id: string,
    facts: { nftItemId: number; nftAddress: string; mintTxHash: string; metadataUrl: string },
  ): Promise<HoldingNftRecord | null>;
  /**
   * minting → minting — persist the EXPECTED on-chain facts (item index + tx hash)
   * BEFORE the broadcast, so a crash between send and markMinted can be reconciled by
   * the retry path (check-before-mint) instead of double-minting. Guarded to minting.
   */
  persistMintExpectation(
    id: string,
    facts: { nftItemId: number; mintTxHash: string },
  ): Promise<HoldingNftRecord | null>;
  /** minted → transferring (guarded claim; null when already claimed). */
  claimForTransfer(id: string): Promise<HoldingNftRecord | null>;
  /** transferring → delivered with the transfer tx hash. */
  markDelivered(id: string, transferTxHash: string): Promise<HoldingNftRecord | null>;
  /** any non-terminal → failed with a sanitized error code + message. */
  markFailed(id: string, code: string, message: string): Promise<HoldingNftRecord | null>;
  /**
   * failed → pending (attempts + errors reset, on-chain facts PRESERVED) — explicit retry
   * only. Preserving nftItemId/mintTxHash/nftAddress lets the next run reconcile via
   * itemStatus and adopt an already-landed mint instead of minting a duplicate.
   */
  retry(id: string): Promise<HoldingNftRecord | null>;
  /** minting → pending — release a transiently-failed mint attempt for the next BullMQ retry. */
  releaseMintForRetry(id: string): Promise<HoldingNftRecord | null>;
  /** transferring → minted — release a transiently-failed transfer so the next attempt re-transfers (never re-mints). */
  releaseTransferForRetry(id: string): Promise<HoldingNftRecord | null>;
  /** Stale pending records (created before cutoff) for the boot/recovery sweep. */
  listStalePending(olderThan: Date): Promise<HoldingNftRecord[]>;
};

function mapRow(r: {
  id: string;
  holdingKey: string;
  userId: string;
  propertyId: string;
  walletAddress: string;
  collectionAddress: string | null;
  nftItemId: number | null;
  nftAddress: string | null;
  status: string;
  metadataUrl: string | null;
  mintTxHash: string | null;
  transferTxHash: string | null;
  attempts: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): HoldingNftRecord {
  return {
    id: r.id,
    holdingKey: r.holdingKey,
    userId: r.userId,
    propertyId: r.propertyId,
    walletAddress: r.walletAddress,
    collectionAddress: r.collectionAddress,
    nftItemId: r.nftItemId != null ? Number(r.nftItemId) : null,
    nftAddress: r.nftAddress,
    status: r.status as NftStatus,
    metadataUrl: r.metadataUrl,
    mintTxHash: r.mintTxHash,
    transferTxHash: r.transferTxHash,
    attempts: Number(r.attempts ?? 0),
    errorCode: r.errorCode,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function createDbNftStore(db: Db): NftStore {
  return {
    async insert(input) {
      const now = new Date();
      const rows = await db
        .insert(holdingNfts)
        .values({
          id: input.id,
          holdingKey: input.holdingKey,
          userId: input.userId,
          propertyId: input.propertyId,
          walletAddress: input.walletAddress,
          collectionAddress: input.collectionAddress ?? null,
          nftItemId: null,
          nftAddress: null,
          status: "pending",
          metadataUrl: input.metadataUrl ?? null,
          mintTxHash: null,
          transferTxHash: null,
          attempts: 0,
          errorCode: null,
          errorMessage: null,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({ target: holdingNfts.holdingKey })
        .returning();
      const row = rows[0];
      if (!row) {
        const existing = await db
          .select()
          .from(holdingNfts)
          .where(eq(holdingNfts.holdingKey, input.holdingKey))
          .limit(1);
        return {
          record: mapRow(existing[0]!),
          created: false,
        };
      }
      return { record: mapRow(row), created: true };
    },

    async get(id) {
      const rows = await db
        .select()
        .from(holdingNfts)
        .where(eq(holdingNfts.id, id))
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async listByUser(userId) {
      const rows = await db
        .select()
        .from(holdingNfts)
        .where(eq(holdingNfts.userId, userId))
        .orderBy(desc(holdingNfts.createdAt));
      return rows.map(mapRow);
    },

    async getByHolding(userId, propertyId) {
      const rows = await db
        .select()
        .from(holdingNfts)
        .where(
          and(
            eq(holdingNfts.userId, userId),
            eq(holdingNfts.propertyId, propertyId),
          ),
        )
        .limit(1);
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async listAll(opts = {}) {
      const rows = await db
        .select()
        .from(holdingNfts)
        .where(opts.status ? eq(holdingNfts.status, opts.status) : undefined)
        .orderBy(desc(holdingNfts.createdAt));
      return rows.map(mapRow);
    },

    async claimForMint(id) {
      const rows = await db
        .update(holdingNfts)
        .set({ status: "minting", updatedAt: new Date() })
        .where(
          and(eq(holdingNfts.id, id), sql`${holdingNfts.status} = 'pending'`),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markMinted(id, facts) {
      const rows = await db
        .update(holdingNfts)
        .set({
          status: "minted",
          nftItemId: facts.nftItemId,
          nftAddress: facts.nftAddress,
          mintTxHash: facts.mintTxHash,
          metadataUrl: facts.metadataUrl,
          updatedAt: new Date(),
        })
        .where(
          and(eq(holdingNfts.id, id), sql`${holdingNfts.status} = 'minting'`),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async persistMintExpectation(id, facts) {
      const rows = await db
        .update(holdingNfts)
        .set({
          nftItemId: facts.nftItemId,
          mintTxHash: facts.mintTxHash,
          updatedAt: new Date(),
        })
        .where(
          and(eq(holdingNfts.id, id), sql`${holdingNfts.status} = 'minting'`),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async claimForTransfer(id) {
      const rows = await db
        .update(holdingNfts)
        .set({ status: "transferring", updatedAt: new Date() })
        .where(
          and(eq(holdingNfts.id, id), sql`${holdingNfts.status} = 'minted'`),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markDelivered(id, transferTxHash) {
      const rows = await db
        .update(holdingNfts)
        .set({
          status: "delivered",
          transferTxHash,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(holdingNfts.id, id),
            sql`${holdingNfts.status} = 'transferring'`,
          ),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async markFailed(id, code, message) {
      const rows = await db
        .update(holdingNfts)
        .set({
          status: "failed",
          errorCode: code,
          errorMessage: message.slice(0, 500),
          attempts: sql`${holdingNfts.attempts} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(holdingNfts.id, id),
            inArray(holdingNfts.status, [
              "pending",
              "minting",
              "minted",
              "transferring",
            ]),
          ),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async retry(id) {
      const rows = await db
        .update(holdingNfts)
        .set({
          status: "pending",
          attempts: 0,
          errorCode: null,
          errorMessage: null,
          // nftItemId / nftAddress / mintTxHash are intentionally PRESERVED so the
          // retry can reconcile the on-chain item (check-before-mint) instead of
          // double-minting a mint that may already have landed.
          updatedAt: new Date(),
        })
        .where(and(eq(holdingNfts.id, id), sql`${holdingNfts.status} = 'failed'`))
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async releaseMintForRetry(id) {
      const rows = await db
        .update(holdingNfts)
        .set({ status: "pending", updatedAt: new Date() })
        .where(
          and(eq(holdingNfts.id, id), sql`${holdingNfts.status} = 'minting'`),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async releaseTransferForRetry(id) {
      const rows = await db
        .update(holdingNfts)
        .set({ status: "minted", updatedAt: new Date() })
        .where(
          and(
            eq(holdingNfts.id, id),
            sql`${holdingNfts.status} = 'transferring'`,
          ),
        )
        .returning();
      const row = rows[0];
      return row ? mapRow(row) : null;
    },

    async listStalePending(olderThan) {
      const rows = await db
        .select()
        .from(holdingNfts)
        .where(
          and(
            eq(holdingNfts.status, "pending"),
            lt(holdingNfts.createdAt, olderThan),
          ),
        )
        .orderBy(asc(holdingNfts.createdAt));
      return rows.map(mapRow);
    },
  };
}

/** In-memory store for unit tests (no Postgres). Mirrors DB guard semantics. */
export function createMemoryNftStore(
  seed: HoldingNftRecord[] = [],
): NftStore & { _rows: HoldingNftRecord[] } {
  const rows = seed.map((r) => ({ ...r }));
  const now = () => new Date();

  function setStatus(id: string, status: NftStatus, patch: Partial<HoldingNftRecord> = {}): HoldingNftRecord | null {
    const r = rows.find((x) => x.id === id);
    if (!r) return null;
    Object.assign(r, { ...patch, status, updatedAt: now() });
    return { ...r };
  }

  return {
    _rows: rows,
    async insert(input) {
      const existing = rows.find((r) => r.holdingKey === input.holdingKey);
      if (existing) return { record: { ...existing }, created: false };
      const record: HoldingNftRecord = {
        id: input.id,
        holdingKey: input.holdingKey,
        userId: input.userId,
        propertyId: input.propertyId,
        walletAddress: input.walletAddress,
        collectionAddress: input.collectionAddress ?? null,
        nftItemId: null,
        nftAddress: null,
        status: "pending",
        metadataUrl: input.metadataUrl ?? null,
        mintTxHash: null,
        transferTxHash: null,
        attempts: 0,
        errorCode: null,
        errorMessage: null,
        createdAt: now(),
        updatedAt: now(),
      };
      rows.push(record);
      return { record: { ...record }, created: true };
    },
    async get(id) {
      const r = rows.find((x) => x.id === id);
      return r ? { ...r } : null;
    },
    async listByUser(userId) {
      return rows
        .filter((r) => r.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((r) => ({ ...r }));
    },
    async getByHolding(userId, propertyId) {
      const r = rows.find(
        (x) => x.userId === userId && x.propertyId === propertyId,
      );
      return r ? { ...r } : null;
    },
    async listAll(opts = {}) {
      return rows
        .filter((r) => (opts.status ? r.status === opts.status : true))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .map((r) => ({ ...r }));
    },
    async claimForMint(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "pending") return null;
      return setStatus(id, "minting");
    },
    async markMinted(id, facts) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "minting") return null;
      return setStatus(id, "minted", {
        nftItemId: facts.nftItemId,
        nftAddress: facts.nftAddress,
        mintTxHash: facts.mintTxHash,
        metadataUrl: facts.metadataUrl,
      });
    },
    async persistMintExpectation(id, facts) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "minting") return null;
      return setStatus(id, r.status, {
        nftItemId: facts.nftItemId,
        mintTxHash: facts.mintTxHash,
      });
    },
    async claimForTransfer(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "minted") return null;
      return setStatus(id, "transferring");
    },
    async markDelivered(id, transferTxHash) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "transferring") return null;
      return setStatus(id, "delivered", { transferTxHash });
    },
    async markFailed(id, code, message) {
      const r = rows.find((x) => x.id === id);
      if (!r || ["delivered", "failed"].includes(r.status)) return null;
      return setStatus(id, "failed", {
        errorCode: code,
        errorMessage: message.slice(0, 500),
        attempts: r.attempts + 1,
      });
    },
    async retry(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "failed") return null;
      // On-chain facts (nftItemId / nftAddress / mintTxHash) are PRESERVED for the
      // check-before-mint reconciliation on retry — see the DB store above.
      return setStatus(id, "pending", {
        attempts: 0,
        errorCode: null,
        errorMessage: null,
      });
    },
    async releaseMintForRetry(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "minting") return null;
      return setStatus(id, "pending");
    },
    async releaseTransferForRetry(id) {
      const r = rows.find((x) => x.id === id);
      if (!r || r.status !== "transferring") return null;
      return setStatus(id, "minted");
    },
    async listStalePending(olderThan) {
      return rows
        .filter(
          (r) => r.status === "pending" && r.createdAt.getTime() < olderThan.getTime(),
        )
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((r) => ({ ...r }));
    },
  };
}
