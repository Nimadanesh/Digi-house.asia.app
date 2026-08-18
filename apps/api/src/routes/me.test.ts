import { describe, expect, it } from "vitest";
import { Address } from "@ton/core";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryHoldingStore } from "../portfolio/holding-store.js";
import { createMemoryShareLockStore } from "../yield/lock-store.js";
import { createMemoryYieldStore } from "../yield/yield-store.js";
import { createMeRoutes } from "./me.js";
import { createEarningsRoutes } from "./earnings.js";
import { createMemoryEarningsStore } from "../earnings/earnings-store.js";

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };
const USER = "user-a";

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

describe("GET /v1/me/summary", () => {
  it("returns balances, locked/free split and yield figures", async () => {
    const balances = createMemoryBalanceStore();
    await balances.adjust(USER, { investingDelta: 12_000, withdrawableDelta: 3_400 });
    const holdings = createMemoryHoldingStore();
    await holdings.upsert({
      userId: USER,
      propertyId: "prop-1",
      sharesOwned: 10,
      avgCostUsd: 10_000,
    });
    const locks = createMemoryShareLockStore();
    await locks.create({
      id: "lock-1",
      userId: USER,
      propertyId: "prop-1",
      shares: 6,
      principalUsd: 60_000,
      payoutPeriod: "monthly",
      monthlyRate: 6,
      nextPayoutAt: new Date(Date.now() + 30 * 86_400_000),
    });
    const app = createMeRoutes({
      session: SESSION,
      users: createMemoryUserStore([{ id: USER, displayName: "A" }]),
      balances,
      holdings,
      locks,
      yields: createMemoryYieldStore(),
    });

    const res = await app.request("/v1/me/summary", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      balances: { investingUsd: number; withdrawableUsd: number };
      shares: { locked: number; free: number };
      yield: { projectedMonthlyUsd: number; projectedWeeklyUsd: number };
    };
    expect(body.balances).toEqual({ investingUsd: 12_000, withdrawableUsd: 3_400 });
    expect(body.shares).toEqual({ locked: 6, free: 4 });
    // $600 @ 6% → $36/month; weekly (5%) → one installment $7.50
    expect(body.yield.projectedMonthlyUsd).toBe(3_600);
    expect(body.yield.projectedWeeklyUsd).toBe(750);
  });

  it("401 without auth and zeros without deps", async () => {
    const app = createMeRoutes({
      session: SESSION,
      users: createMemoryUserStore([{ id: USER, displayName: "A" }]),
      balances: null,
      holdings: null,
      locks: null,
      yields: null,
    });
    const noAuth = await app.request("/v1/me/summary");
    expect(noAuth.status).toBe(401);
    const res = await app.request("/v1/me/summary", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      balances: { investingUsd: 0, withdrawableUsd: 0 },
      shares: { locked: 0, free: 0 },
    });
  });
});

describe("POST /v1/me/withdrawal-address (PE-01)", () => {
  // Genuine address built with @ton/core, matching the API's validation.
  const VALID = Address.parseRaw("0:" + "ab".repeat(32)).toString({ bounceable: true });
  const OTHER = Address.parseRaw("0:" + "cd".repeat(32)).toString({ bounceable: true });

  function appWith(users = createMemoryUserStore([{ id: USER, displayName: "A" }])) {
    return createMeRoutes({
      session: SESSION,
      users,
      balances: null,
      holdings: null,
      locks: null,
      yields: null,
    });
  }

  it("saves a valid address and returns the user unverified", async () => {
    const app = appWith();
    const res = await app.request("/v1/me/withdrawal-address", {
      method: "POST",
      headers: { Authorization: await bearerFor(USER), "Content-Type": "application/json" },
      body: JSON.stringify({ address: VALID }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: { withdrawalAddress: string; withdrawalAddressVerified: boolean };
    };
    expect(body.user.withdrawalAddress).toBe(VALID);
    expect(body.user.withdrawalAddressVerified).toBe(false);
  });

  it("changing the address resets a previous verification", async () => {
    const app = appWith(
      createMemoryUserStore([
        {
          id: USER,
          displayName: "A",
          withdrawalAddress: OTHER,
          withdrawalAddressVerified: true,
        },
      ]),
    );
    const res = await app.request("/v1/me/withdrawal-address", {
      method: "POST",
      headers: { Authorization: await bearerFor(USER), "Content-Type": "application/json" },
      body: JSON.stringify({ address: VALID }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      user: { withdrawalAddress: string; withdrawalAddressVerified: boolean };
    };
    expect(body.user.withdrawalAddress).toBe(VALID);
    expect(body.user.withdrawalAddressVerified).toBe(false);
  });

  it("rejects a malformed address with 400", async () => {
    const app = appWith();
    const res = await app.request("/v1/me/withdrawal-address", {
      method: "POST",
      headers: { Authorization: await bearerFor(USER), "Content-Type": "application/json" },
      body: JSON.stringify({ address: "definitely-not-a-ton-address" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("validation_error");
  });

  it("rejects a missing address with 400", async () => {
    const app = appWith();
    const res = await app.request("/v1/me/withdrawal-address", {
      method: "POST",
      headers: { Authorization: await bearerFor(USER), "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("requires auth", async () => {
    const app = appWith();
    const res = await app.request("/v1/me/withdrawal-address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: VALID }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /v1/earnings (v2 yield block)", () => {
  it("adds a yield block when yieldDeps provided; absent otherwise", async () => {
    const users = createMemoryUserStore([{ id: USER, displayName: "A" }]);
    const earningsStore = createMemoryEarningsStore();
    const locks = createMemoryShareLockStore();
    const yields = createMemoryYieldStore();
    await locks.create({
      id: "lock-1",
      userId: USER,
      propertyId: "prop-1",
      shares: 10,
      principalUsd: 100_000,
      payoutPeriod: "weekly",
      monthlyRate: 6,
      nextPayoutAt: new Date(Date.now() + 7 * 86_400_000),
    });

    const withYield = createEarningsRoutes({
      session: SESSION,
      users,
      earnings: earningsStore,
      yieldDeps: { locks, yields },
    });
    const res = await withYield.request("/v1/earnings", {
      headers: { Authorization: await bearerFor(USER) },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      yield: { activeLocks: number; projectedWeeklyUsd: number; payments: unknown[] };
    };
    expect(body.yield.activeLocks).toBe(1);
    expect(body.yield.projectedWeeklyUsd).toBe(1_250); // $1,000 @ 5% / 4
    expect(body.yield.payments).toEqual([]);

    const withoutYield = createEarningsRoutes({
      session: SESSION,
      users,
      earnings: earningsStore,
    });
    const res2 = await withoutYield.request("/v1/earnings", {
      headers: { Authorization: await bearerFor(USER) },
    });
    const body2 = (await res2.json()) as Record<string, unknown>;
    expect(body2.yield).toBeUndefined();
  });
});
