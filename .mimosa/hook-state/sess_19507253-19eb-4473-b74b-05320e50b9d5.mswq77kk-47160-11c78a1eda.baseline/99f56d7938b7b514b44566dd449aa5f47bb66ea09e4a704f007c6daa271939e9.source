import { describe, expect, it } from "vitest";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryPropertyStore } from "../marketplace/property-store.js";
import { toPropertyInsert } from "../db/seed/map-property.js";
import { SEED_PROPERTIES } from "../db/seed/properties-data.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryYieldStore } from "../yield/yield-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createLockRoutes, type LockRouteDeps } from "./locks.js";

const SESSION = {
  secret: "test-session-secret-at-least-32-chars",
  ttlSeconds: 3600,
};
const USER = "user-a";

function seedUser(id: string, displayName: string) {
  return { id, displayName };
}

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeDeps() {
  const property = SEED_PROPERTIES.find((p) => p.status === "funding")!;
  const deps: LockRouteDeps = {
    session: SESSION,
    users: createMemoryUserStore([seedUser(USER, "Alice")]),
    holdings: createMemoryHoldingStore(),
    properties: createMemoryPropertyStore(SEED_PROPERTIES.map(toPropertyInsert)),
    locks: createMemoryShareLockStore(),
    yields: createMemoryYieldStore(),
    balances: createMemoryBalanceStore(),
    transactions: createMemoryTxStore(),
    unlockMaturationMs: 3 * 86_400_000,
    // shared module-level limiter state would trip across tests — bypass it
    rateLimiter: async (_c, next) => next(),
  };
  return { deps, propertyId: property.id };
}

const jsonHeaders = (bearer: string) => ({
  "content-type": "application/json",
  Authorization: bearer,
});

describe("POST /v1/locks", () => {
  it("201 — locks free shares and snapshots rate from the property", async () => {
    const { deps, propertyId } = makeDeps();
    const listing = await deps.properties.getById(propertyId);
    await deps.holdings.upsert({
      userId: USER,
      propertyId,
      sharesOwned: 10,
      avgCostUsd: 10_000,
    });
    const app = createLockRoutes(deps);
    const res = await app.request("/v1/locks", {
      method: "POST",
      headers: jsonHeaders(await bearerFor(USER)),
      body: JSON.stringify({ propertyId, shares: 5, payoutPeriod: "weekly" }),
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.shares).toBe(5);
    expect(body.principalUsd).toBe(50_000);
    expect(body.monthlyRate).toBe(listing!.monthlyYieldRate);
    expect(body.status).toBe("locked");
    expect(body.payoutPeriod).toBe("weekly");
  });

  it("409 — cannot lock more than free shares (holding minus active locks)", async () => {
    const { deps, propertyId } = makeDeps();
    await deps.holdings.upsert({
      userId: USER,
      propertyId,
      sharesOwned: 10,
      avgCostUsd: 10_000,
    });
    const app = createLockRoutes(deps);
    const headers = jsonHeaders(await bearerFor(USER));
    await app.request("/v1/locks", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId, shares: 8, payoutPeriod: "monthly" }),
    });
    const res = await app.request("/v1/locks", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId, shares: 5, payoutPeriod: "monthly" }),
    });
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      code: "insufficient_free_shares",
    });
  });

  it("404 — no holding in this property", async () => {
    const { deps, propertyId } = makeDeps();
    const app = createLockRoutes(deps);
    const res = await app.request("/v1/locks", {
      method: "POST",
      headers: jsonHeaders(await bearerFor(USER)),
      body: JSON.stringify({ propertyId, shares: 1, payoutPeriod: "monthly" }),
    });
    expect(res.status).toBe(404);
  });

  it("400 — invalid payload / 401 without auth", async () => {
    const { deps, propertyId } = makeDeps();
    const app = createLockRoutes(deps);
    const headers = jsonHeaders(await bearerFor(USER));
    const badPeriod = await app.request("/v1/locks", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId, shares: 1, payoutPeriod: "daily" }),
    });
    expect(badPeriod.status).toBe(400);
    const badShares = await app.request("/v1/locks", {
      method: "POST",
      headers,
      body: JSON.stringify({ propertyId, shares: 0, payoutPeriod: "monthly" }),
    });
    expect(badShares.status).toBe(400);
    const noAuth = await app.request("/v1/locks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propertyId, shares: 1, payoutPeriod: "monthly" }),
    });
    expect(noAuth.status).toBe(401);
  });
});

describe("POST /v1/locks/:id/unlock-request", () => {
  it("pays final accrued yield and schedules maturation", async () => {
    const { deps, propertyId } = makeDeps();
    await deps.holdings.upsert({
      userId: USER,
      propertyId,
      sharesOwned: 10,
      avgCostUsd: 10_000,
    });
    const app = createLockRoutes(deps);
    const headers = jsonHeaders(await bearerFor(USER));
    const created = (await (
      await app.request("/v1/locks", {
        method: "POST",
        headers,
        body: JSON.stringify({ propertyId, shares: 10, payoutPeriod: "monthly" }),
      })
    ).json()) as { id: string };

    const res = await app.request(`/v1/locks/${created.id}/unlock-request`, {
      method: "POST",
      headers,
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      lock: { status: string; maturesAt: string | null; accruedUnpaidUsd: number };
      finalPayment: { amountUsd: number; kind: string } | null;
    };
    expect(body.lock.status).toBe("unlock_requested");
    expect(body.lock.maturesAt).toBeTruthy();
    // same-day request: exactly one accrual day, paid out in full as 'final'
    expect(body.finalPayment?.kind).toBe("final");
    expect(body.lock.accruedUnpaidUsd).toBe(0);
    const balance = await deps.balances.get(USER);
    expect(balance?.withdrawableUsd).toBe(body.finalPayment!.amountUsd);
    expect(body.finalPayment!.amountUsd).toBeGreaterThan(0);

    // second request → 409
    const again = await app.request(`/v1/locks/${created.id}/unlock-request`, {
      method: "POST",
      headers,
    });
    expect(again.status).toBe(409);
  });

  it("404 — someone else's lock", async () => {
    const { deps, propertyId } = makeDeps();
    const lock = await deps.locks.create({
      id: "lock_other",
      userId: "user-b",
      propertyId,
      shares: 1,
      principalUsd: 10_000,
      payoutPeriod: "monthly",
      monthlyRate: 5.5,
      nextPayoutAt: new Date(Date.now() + 30 * 86_400_000),
    });
    const app = createLockRoutes(deps);
    const res = await app.request(`/v1/locks/${lock.id}/unlock-request`, {
      method: "POST",
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(res.status).toBe(404);
  });
});

describe("GET /v1/locks", () => {
  it("lists the caller's locks with projections", async () => {
    const { deps, propertyId } = makeDeps();
    await deps.holdings.upsert({
      userId: USER,
      propertyId,
      sharesOwned: 10,
      avgCostUsd: 10_000,
    });
    const app = createLockRoutes(deps);
    await app.request("/v1/locks", {
      method: "POST",
      headers: jsonHeaders(await bearerFor(USER)),
      body: JSON.stringify({ propertyId, shares: 10, payoutPeriod: "monthly" }),
    });
    const res = await app.request("/v1/locks", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      locks: Array<{ shares: number; projectedMonthlyUsd: number; projectedWeeklyUsd: number }>;
    };
    expect(body.locks).toHaveLength(1);
    expect(body.locks[0]!.shares).toBe(10);
    expect(body.locks[0]!.projectedMonthlyUsd).toBeGreaterThan(
      body.locks[0]!.projectedWeeklyUsd,
    );
  });
});
