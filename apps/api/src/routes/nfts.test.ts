import { describe, expect, it } from "vitest";
import { Address } from "ton";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryNftStore } from "../nft/nft-store.js";
import { createNftMetadataRoute, createNftRoutes } from "./nfts.js";

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };
const USER = "user-a";
const OTHER = "user-b";
const ADDR = new Address(0, Buffer.alloc(32, 1)).toString();

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeApp() {
  const users = createMemoryUserStore([
    { id: USER, displayName: "A", walletAddress: ADDR, withdrawalAddress: null },
    { id: OTHER, displayName: "B", walletAddress: null, withdrawalAddress: null },
  ]);
  const properties = createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert));
  const holdings = createMemoryHoldingStore([
    { userId: USER, propertyId: "prop-marina-vista-4b", sharesOwned: 100, avgCostUsd: 12_500, updatedAt: new Date() },
  ]);
  const nfts = createMemoryNftStore();
  const deps = { session: SESSION, users, nfts, properties, holdings };
  const app = createNftRoutes(deps);
  const metaApp = createNftMetadataRoute(deps);
  return { app, metaApp, nfts, holdings };
}

describe("GET /v1/nfts (Phase 8)", () => {
  it("requires auth", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/nfts");
    expect(res.status).toBe(401);
  });

  it("returns the caller's NFTs with property + holding info", async () => {
    const { app, nfts } = makeApp();
    await nfts.insert({
      id: "nft_1",
      holdingKey: `${USER}:prop-marina-vista-4b`,
      userId: USER,
      propertyId: "prop-marina-vista-4b",
      walletAddress: ADDR,
      metadataUrl: "http://localhost:8787/nft-metadata/nft_1.json",
    });
    const res = await app.request("/v1/nfts", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { nfts: Array<{ id: string; status: string; sharesOwned: number }> };
    expect(body.nfts).toHaveLength(1);
    expect(body.nfts[0]?.id).toBe("nft_1");
    expect(body.nfts[0]?.status).toBe("pending");
    expect(body.nfts[0]?.sharesOwned).toBe(100);
  });

  it("is scoped per user — other users see nothing (no IDOR)", async () => {
    const { app, nfts } = makeApp();
    await nfts.insert({
      id: "nft_1",
      holdingKey: `${USER}:prop-marina-vista-4b`,
      userId: USER,
      propertyId: "prop-marina-vista-4b",
      walletAddress: ADDR,
    });
    const res = await app.request("/v1/nfts", {
      headers: { Authorization: await bearerFor(OTHER) },
    });
    expect((await res.json()) as { nfts: unknown[] }).toEqual({ nfts: [] });
  });

  it("single fetch: owner sees it, other users get 404 (no enumeration)", async () => {
    const { app, nfts } = makeApp();
    await nfts.insert({
      id: "nft_1",
      holdingKey: `${USER}:prop-marina-vista-4b`,
      userId: USER,
      propertyId: "prop-marina-vista-4b",
      walletAddress: ADDR,
    });
    const owner = await app.request("/v1/nfts/nft_1", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(owner.status).toBe(200);

    const other = await app.request("/v1/nfts/nft_1", {
      headers: { Authorization: await bearerFor(OTHER) },
    });
    expect(other.status).toBe(404);

    const missing = await app.request("/v1/nfts/nft_nope", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(missing.status).toBe(404);
  });
});

describe("GET /nft-metadata/:id.json (public, Phase 4)", () => {
  it("serves deterministic public metadata without auth", async () => {
    const { metaApp, nfts } = makeApp();
    await nfts.insert({
      id: "nft_1",
      holdingKey: `${USER}:prop-marina-vista-4b`,
      userId: USER,
      propertyId: "prop-marina-vista-4b",
      walletAddress: ADDR,
    });
    const res = await metaApp.request("/nft-metadata/nft_1.json");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      name: string;
      attributes: Array<{ trait_type: string; value: string }>;
    };
    expect(body.name).toContain("FractionalLuxe");
    const attrs = Object.fromEntries(body.attributes.map((a) => [a.trait_type, a.value]));
    expect(attrs["Shares"]).toBe("100");
    expect(JSON.stringify(body)).not.toContain("user-a");
  });

  it("404 for unknown NFTs", async () => {
    const { metaApp } = makeApp();
    const res = await metaApp.request("/nft-metadata/nft_nope.json");
    expect(res.status).toBe(404);
  });
});
