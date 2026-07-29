import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import type { ApiEnv } from "../env.js";
import type { Logger } from "../logger.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import type { ListingPublic } from "../marketplace/map-listing.js";

const silentLog = {
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  debug: () => {},
  trace: () => {},
  child: () => silentLog,
} as unknown as Logger;

function testEnv(): ApiEnv {
  return {
    NODE_ENV: "test",
    PORT: 8787,
    LOG_LEVEL: "silent",
    SETTLEMENT_MODE: undefined,
    DATABASE_URL: undefined,
    TELEGRAM_BOT_TOKEN: "",
    SESSION_SECRET: "test-session-secret-at-least-32-chars",
    SESSION_TTL_SECONDS: 3600,
    CORS_ORIGIN: "http://localhost:3000",
    TON_RELAY_ADDRESS: undefined,
    BUY_STUB_NANOTON: "10000000",
    BUY_INTENT_TTL_SECONDS: 900,
    REDIS_URL: undefined,
    PAYOUT_TICK_MS: 60000,
    PAYOUT_WORKER_ENABLED: false,
    ALLOW_MANUAL_PAYOUT_TICK: false,
    PAYOUT_TICK_SECRET: undefined,
  };
}

function makeApp() {
  const seedRows = SEED_PROPERTIES.map(toPropertyInsert);
  const properties = createMemoryPropertyStore(seedRows);
  const app = createApp({
    env: testEnv(),
    log: silentLog,
    properties,
  });
  return app;
}

describe("GET /v1/marketplace", () => {
  it("returns ≥6 listings with derived fields", async () => {
    const app = makeApp();
    const res = await app.request("/v1/marketplace");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListingPublic[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(6);

    const sample = body[0]!;
    expect(sample.sharesRemaining).toBe(
      sample.totalShares - sample.sharesSold,
    );
    expect(sample.fundingProgressRatio).toBe(
      sample.totalShares > 0
        ? sample.sharesSold / sample.totalShares
        : 0,
    );
    expect(Number.isInteger(sample.sharePriceUsd)).toBe(true);
    expect(Number.isInteger(sample.annualRentUsd)).toBe(true);
  });

  it("filters ?status=funding", async () => {
    const app = makeApp();
    const res = await app.request("/v1/marketplace?status=funding");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListingPublic[];
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body.every((p) => p.status === "funding")).toBe(true);
  });

  it("filters ?status=funded", async () => {
    const app = makeApp();
    const res = await app.request("/v1/marketplace?status=funded");
    const body = (await res.json()) as ListingPublic[];
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body.every((p) => p.status === "funded")).toBe(true);
  });

  it("filters ?status=resale", async () => {
    const app = makeApp();
    const res = await app.request("/v1/marketplace?status=resale");
    const body = (await res.json()) as ListingPublic[];
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body.every((p) => p.status === "resale")).toBe(true);
  });

  it("filters ?query=marina case-insensitively", async () => {
    const app = makeApp();
    const res = await app.request("/v1/marketplace?query=MARINA");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListingPublic[];
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(
      body.every(
        (p) =>
          p.title.toLowerCase().includes("marina") ||
          p.location.toLowerCase().includes("marina"),
      ),
    ).toBe(true);
  });

  it("returns 400 for invalid status", async () => {
    const app = makeApp();
    const res = await app.request("/v1/marketplace?status=nope");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("validation_error");
  });
});

describe("GET /v1/properties/:id", () => {
  it("returns 200 + Listing for seeded id", async () => {
    const app = makeApp();
    const id = "prop-marina-vista-4b";
    const res = await app.request(`/v1/properties/${id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as ListingPublic;
    expect(body.id).toBe(id);
    expect(body.sharesRemaining).toBe(body.totalShares - body.sharesSold);
    expect(typeof body.fundingProgressRatio).toBe("number");
    expect(body.meta).toBeDefined();
    expect(Number.isInteger(body.sharePriceUsd)).toBe(true);
  });

  it("matches list mapper for same id", async () => {
    const app = makeApp();
    const id = "prop-marina-vista-4b";
    const detail = (await (
      await app.request(`/v1/properties/${id}`)
    ).json()) as ListingPublic;
    const list = (await (
      await app.request("/v1/marketplace")
    ).json()) as ListingPublic[];
    const fromList = list.find((p) => p.id === id);
    expect(fromList).toBeDefined();
    expect(detail.sharePriceUsd).toBe(fromList!.sharePriceUsd);
    expect(detail.sharesRemaining).toBe(fromList!.sharesRemaining);
    expect(detail.fundingProgressRatio).toBe(fromList!.fundingProgressRatio);
  });

  it("returns 404 for unknown id", async () => {
    const app = makeApp();
    const res = await app.request("/v1/properties/does-not-exist-zz");
    expect(res.status).toBe(404);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("not_found");
  });
});
