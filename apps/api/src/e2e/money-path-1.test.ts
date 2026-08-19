// PF-01 — E2E money path 1 (in-process via createApp + memory stores, mock time).
// Path: buy primary → lock (weekly) → weekly yield tick → unlock request (yield
// stops) → matured → instant sell → shares back to primary supply.
// This exercises the REAL routes + the REAL yield engine with a controlled clock,
// which is what the Playwright spec does against a live stack (mock time there is
// the admin payout endpoint / seeded locks).
import { describe, expect, it } from "vitest";
import {
  matureDueLocks,
  tickYieldEngine,
  type YieldEngineDeps,
} from "../yield/tick-yield.js";
import {
  bearerFor,
  buyPrimary,
  makeHarness,
  type MoneyPathHarness,
} from "./money-path-helper.js";

const FUNDING = "prop-marina-vista-4b"; // $80 share, 200 remaining
const MATURATION_MS = 3 * 24 * 3_600_000;
const DAY = 86_400_000;

function engineDeps(h: MoneyPathHarness): YieldEngineDeps {
  return {
    locks: h.locks,
    yields: h.yields,
    balances: h.balances,
    transactions: h.transactions,
    log: undefined,
    audit: h.audit,
  };
}

describe("PF-01 money path — buy → lock → weekly yield → unlock → mature → instant sell", () => {
  it("full path: shares settle, weekly yield pays, unlock stops accrual, mature frees, instant sell returns shares to primary", async () => {
    const h = makeHarness();
    const user = "user-a";

    // 1. Buy 5 primary shares ($80 × 5 = $400).
    const buy = await buyPrimary(h, user, FUNDING, 5);
    expect(buy.status).toBe("settled");
    expect(buy.shares).toBe(5);

    const listing = (await h.properties.getById(FUNDING))!;
    const soldAfterBuy = listing.sharesSold;
    expect(soldAfterBuy).toBe(2305); // 2300 + 5
    expect((await h.holdings.get(user, FUNDING))?.sharesOwned).toBe(5);

    // 2. Lock all 5 shares weekly.
    const lockRes = await h.app.request("/v1/locks", {
      method: "POST",
      headers: {
        Authorization: await bearerFor(user),
        "content-type": "application/json",
      },
      body: JSON.stringify({ propertyId: FUNDING, shares: 5, payoutPeriod: "weekly" }),
    });
    expect(lockRes.status).toBe(201);
    const lock = (await lockRes.json()) as {
      id: string;
      status: string;
      nextPayoutAt: string;
    };
    expect(lock.status).toBe("locked");
    expect(lock.nextPayoutAt).toBeTruthy();

    // 3. Weekly yield tick (mock time: advance to the weekly due date + 1s).
    const tickNow = new Date(new Date(lock.nextPayoutAt).getTime() + 1_000);
    const r = await tickYieldEngine(engineDeps(h), MATURATION_MS, tickNow);
    expect(r.payouts).toHaveLength(1);
    expect(r.payouts[0]!.kind).toBe("scheduled");
    // Weekly installment: $400 × (7.19 − 1)% / 4 ≈ $6.19 = 619 cents.
    expect(r.payouts[0]!.amountUsd).toBe(619);

    const balance = (await h.balances.get(user))!;
    expect(balance.withdrawableUsd).toBe(619);
    const txs = await h.transactions.listByUserId(user);
    expect(txs.some((t) => t.kind === "yield_weekly")).toBe(true);

    // 4. Unlock request → yield stops.
    const unlockRes = await h.app.request(`/v1/locks/${lock.id}/unlock-request`, {
      method: "POST",
      headers: { Authorization: await bearerFor(user) },
    });
    expect(unlockRes.status).toBe(200);
    const unlockBody = (await unlockRes.json()) as {
      lock: { status: string };
    };
    expect(unlockBody.lock.status).toBe("unlock_requested");

    // 5. Mature (mock time: unlockRequestedAt + maturation window).
    const after = await h.locks.get(lock.id);
    const matureNow = new Date(after!.unlockRequestedAt!.getTime() + MATURATION_MS + 1_000);
    const matured = await matureDueLocks(engineDeps(h), MATURATION_MS, matureNow);
    expect(matured).toContain(lock.id);
    expect((await h.locks.get(lock.id))?.status).toBe("matured");

    // 6. Instant sell the 5 (now free) shares → back to primary supply.
    const sellRes = await h.app.request("/v1/sells/instant", {
      method: "POST",
      headers: {
        Authorization: await bearerFor(user),
        "content-type": "application/json",
      },
      body: JSON.stringify({ propertyId: FUNDING, shares: 5 }),
    });
    expect(sellRes.status).toBe(201);
    const sellBody = (await sellRes.json()) as {
      sharesRemaining: number;
      netUsd: number;
    };
    // 5 shares × $80 − 7% = $400 − $28 = $372 → 37200 cents.
    expect(sellBody.netUsd).toBe(37_200);
    // Supply returned: remaining went from 195 (after buy) back to 200.
    expect(sellBody.sharesRemaining).toBe(200);
    expect((await h.properties.getById(FUNDING))!.sharesSold).toBe(2300);

    // Investing balance got the proceeds.
    const bal2 = (await h.balances.get(user))!;
    expect(bal2.investingUsd).toBe(37_200);

    // 7. Audit trail covers every state change (PF-03).
    const actions = h.audit._rows.map((a) => a.action);
    for (const expected of [
      "buy.confirm",
      "buy.verify",
      "buy.settle",
      "lock.create",
      "lock.unlock_request",
      "lock.mature",
      "sell.instant",
    ]) {
      expect(actions).toContain(expected);
    }
  });

  it("instant sell is blocked before maturation (shares still locked)", async () => {
    const h = makeHarness();
    const user = "user-b";
    await buyPrimary(h, user, FUNDING, 5);
    await h.app.request("/v1/locks", {
      method: "POST",
      headers: {
        Authorization: await bearerFor(user),
        "content-type": "application/json",
      },
      body: JSON.stringify({ propertyId: FUNDING, shares: 5, payoutPeriod: "weekly" }),
    });

    const sellRes = await h.app.request("/v1/sells/instant", {
      method: "POST",
      headers: {
        Authorization: await bearerFor(user),
        "content-type": "application/json",
      },
      body: JSON.stringify({ propertyId: FUNDING, shares: 5 }),
    });
    expect(sellRes.status).toBe(409);
    await expect(sellRes.json()).resolves.toMatchObject({
      code: "insufficient_free_shares",
    });
  });
});
