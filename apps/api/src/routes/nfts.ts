// File responsibility: NFT API (Phase 8). User-facing read routes (owner-only) plus the
// PUBLIC, rate-limited metadata endpoint that wallets/explorers fetch. No user-facing mint
// endpoints — minting is driven by settlement + the worker; admin retry lives in admin.ts.
import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { SessionConfig } from "../auth/session.js";
import { requireSession } from "../auth/require-session.js";
import type { UserStore } from "../auth/user-store.js";
import type { PropertyStore } from "../marketplace/property-store.js";
import type { HoldingStore } from "../portfolio/holding-store.js";
import { createMemoryTokenBucket } from "../lib/rate-limit-memory.js";
import type { NftStore, NftStatus, HoldingNftRecord } from "../nft/nft-store.js";
import { buildNftMetadata } from "../nft/metadata.js";

export type NftPublic = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  sharesOwned: number;
  status: NftStatus;
  walletAddress: string;
  collectionAddress: string | null;
  nftItemId: number | null;
  nftAddress: string | null;
  metadataUrl: string | null;
  mintTxHash: string | null;
  transferTxHash: string | null;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NftRouteDeps = {
  session: SessionConfig;
  users: UserStore;
  nfts: NftStore;
  properties: PropertyStore;
  holdings: HoldingStore;
  rateLimiter?: MiddlewareHandler;
};

async function toPublic(
  deps: NftRouteDeps,
  r: HoldingNftRecord,
): Promise<NftPublic> {
  const property = await deps.properties.getById(r.propertyId);
  const holding = await deps.holdings.get(r.userId, r.propertyId);
  return {
    id: r.id,
    propertyId: r.propertyId,
    propertyTitle: property?.title ?? r.propertyId,
    propertyLocation: property?.location ?? "",
    sharesOwned: holding?.sharesOwned ?? 0,
    status: r.status,
    walletAddress: r.walletAddress,
    collectionAddress: r.collectionAddress,
    nftItemId: r.nftItemId,
    nftAddress: r.nftAddress,
    metadataUrl: r.metadataUrl,
    mintTxHash: r.mintTxHash,
    transferTxHash: r.transferTxHash,
    attempts: r.attempts,
    errorCode: r.errorCode,
    errorMessage: r.errorMessage,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function createNftRoutes(deps: NftRouteDeps) {
  const app = new Hono();
  const sessionMw = requireSession({ session: deps.session, users: deps.users });

  app.get("/v1/nfts", sessionMw, async (c) => {
    const userId = c.get("userId");
    const records = await deps.nfts.listByUser(userId);
    const nfts = await Promise.all(records.map((r) => toPublic(deps, r)));
    return c.json({ nfts });
  });

  app.get("/v1/nfts/:id", sessionMw, async (c) => {
    const userId = c.get("userId");
    const record = await deps.nfts.get(c.req.param("id"));
    // 404 for both unknown and other users' records (no IDOR enumeration).
    if (!record || record.userId !== userId) {
      return c.json({ code: "not_found", message: "NFT not found" }, 404);
    }
    return c.json({ nft: await toPublic(deps, record) });
  });

  return app;
}

/** Public metadata endpoint — stable URL served to wallets/explorers (rate-limited). */
export function createNftMetadataRoute(deps: NftRouteDeps) {
  const app = new Hono();
  const rateLimit =
    deps.rateLimiter ?? createMemoryTokenBucket({ max: 120, windowMs: 60_000 });

  app.get("/nft-metadata/:file", rateLimit, async (c) => {
    // Hono parses `:id.json` as a single param (id.json) — strip the suffix here.
    const file = c.req.param("file") ?? "";
    const id = file.endsWith(".json") ? file.slice(0, -5) : file;
    const record = await deps.nfts.get(id);
    if (!record) {
      return c.json({ code: "not_found", message: "NFT metadata not found" }, 404);
    }
    const property = await deps.properties.getById(record.propertyId);
    const holding = await deps.holdings.get(record.userId, record.propertyId);
    const metadata = buildNftMetadata({
      nftId: record.id,
      propertyTitle: property?.title ?? record.propertyId,
      propertyLocation: property?.location ?? "",
      sharesOwned: holding?.sharesOwned ?? 0,
    });
    return c.json(metadata);
  });

  return app;
}
