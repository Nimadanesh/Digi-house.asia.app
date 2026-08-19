// PF-02 — E2E money path 2 (in-process via createApp + memory stores, mock time).
// Path: buy primary → custom sell (queued) → primary sells out → order activates
// → user-to-user match → withdrawal request → admin approve → admin mark-paid.
// Exercises the real routes: buys, orders (queued + activation + matching),
// withdrawals, and the admin withdrawal queue.
import { describe, expect, it } from "vitest";
import {
  bearerFor,
  buyPrimary,
  makeHarness,
  placeOrder,
  type MoneyPathHarness,
} from "./money-path-helper.js";

const ADMIN_KEY = "test-admin-secret-at-least-32-chars!!";
const DAY = 86_400_000;

/** A small funding property so a single buyer can sell it out. */
const SMALL = {
  id: "prop-e2e-small-funding",
  totalShares: 10,
  sharesSold: 0,
  sharePriceUsd: 8_000, // $80
  status: "funding" as const,
};

describe("PF-02 money path — buy → queued sell → sellout → activation → match → withdrawal", () => {
  it("full path: queued sell activates on sellout, matches user-to-user, withdrawal round-trips via admin", async () => {
    const h = makeHarness({ extraProperties: [SMALL] });
    const seller = "user-a";
    const buyer = "user-b";

    // 1. Seller buys 5 primary shares.
    await buyPrimary(h, seller, SMALL.id, 5);
    expect((await h.holdings.get(seller, SMALL.id))?.sharesOwned).toBe(5);

    // 2. Custom sell → queued (primary still open). Shares escrowed.
    const sellRes = await placeOrder(h, seller, {
      propertyId: SMALL.id,
      side: "sell",
      priceUsd: 9_000, // $90
      quantity: 3,
    });
    expect(sellRes.status).toBe(201);
    const sellOrder = (await sellRes.json()) as {
      id: string;
      status: string;
    };
    expect(sellOrder.status).toBe("queued");
    expect(await h.orders.sumActiveSellShares(seller, SMALL.id)).toBe(3);
    // Queued orders are NOT tradable yet.
    expect(await h.orders.listOpenByPropertyId(SMALL.id)).toHaveLength(0);

    // 3. Buyer buys the remaining 5 primary shares → sellout → activation.
    const buy = await buyPrimary(h, buyer, SMALL.id, 5);
    expect(buy.status).toBe("settled");

    // Property flipped one-way funding → resale.
    const listing = (await h.properties.getById(SMALL.id))!;
    expect(listing.status).toBe("resale");
    // The queued sell activated → open.
    const openSell = (await h.orders.getById(sellOrder.id))!;
    expect(openSell.status).toBe("open");

    // 4. Buyer 2 (user-c) places a crossing buy → user-to-user match.
    await h.balances.adjust("user-c", { investingDelta: 100_000 }); // $1,000
    const bidRes = await placeOrder(h, "user-c", {
      propertyId: SMALL.id,
      side: "buy",
      priceUsd: 9_500, // crosses the $90 ask
      quantity: 3,
    });
    expect(bidRes.status).toBe(201);
    const bidBody = (await bidRes.json()) as {
      status: string;
      executedQuantity?: number;
    };
    expect(bidBody.status).toBe("filled");
    expect(bidBody.executedQuantity).toBe(3);

    // Trade recorded; holdings moved; seller credited.
    expect(h.trades._rows).toHaveLength(1);
    expect((await h.holdings.get(seller, SMALL.id))?.sharesOwned).toBe(2);
    expect((await h.holdings.get("user-c", SMALL.id))?.sharesOwned).toBe(3);
    const sellerBal = (await h.balances.get(seller))!;
    // 3 × $90 = $27,000 notional − 0.9% sell fee (243) = 26,757.
    expect(sellerBal.investingUsd).toBe(26_757);
    // Audit: order.trade emitted for the match.
    expect(h.audit._rows.some((a) => a.action === "order.trade")).toBe(true);
    // Activation + sellout audited (PF-03).
    expect(h.audit._rows.some((a) => a.action === "property.sellout")).toBe(true);
    expect(h.audit._rows.some((a) => a.action === "order.activate")).toBe(true);

    // 5. Seller sets a withdrawal address, earns yield, requests withdrawal.
    await h.users.updateWithdrawalAddress(
      seller,
      "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5",
    );
    // Give the seller withdrawable yield (lock 2 free shares weekly + one tick).
    const lockRes = await h.app.request("/v1/locks", {
      method: "POST",
      headers: {
        Authorization: await bearerFor(seller),
        "content-type": "application/json",
      },
      body: JSON.stringify({ propertyId: SMALL.id, shares: 2, payoutPeriod: "weekly" }),
    });
    expect(lockRes.status).toBe(201);
    const lock = (await lockRes.json()) as { id: string; nextPayoutAt: string };
    const { tickYieldEngine } = await import("../yield/tick-yield.js");
    await tickYieldEngine(
      {
        locks: h.locks,
        yields: h.yields,
        balances: h.balances,
        transactions: h.transactions,
        audit: h.audit,
      },
      3 * 24 * 3_600_000,
      new Date(new Date(lock.nextPayoutAt).getTime() + 1_000),
    );
    const withdrawable = (await h.balances.get(seller))?.withdrawableUsd ?? 0;
    expect(withdrawable).toBeGreaterThan(0);

    const wdRes = await h.app.request("/v1/withdrawals", {
      method: "POST",
      headers: {
        Authorization: await bearerFor(seller),
        "content-type": "application/json",
      },
      body: JSON.stringify({ amountUsd: withdrawable }),
    });
    expect(wdRes.status).toBe(201);
    const wd = (await wdRes.json()) as {
      withdrawal: { id: string; status: string };
    };
    expect(wd.withdrawal.status).toBe("requested");
    // Withdrawable debited at request time.
    expect((await h.balances.get(seller))?.withdrawableUsd).toBe(0);

    // 6. Admin approves → marks paid with a tx hash.
    const adminHeaders = {
      "content-type": "application/json",
      "x-admin-key": ADMIN_KEY,
    };
    const approve = await h.app.request(
      `/v1/admin/withdrawals/${wd.withdrawal.id}/approve`,
      { method: "POST", headers: adminHeaders },
    );
    expect(approve.status).toBe(200);
    const paid = await h.app.request(
      `/v1/admin/withdrawals/${wd.withdrawal.id}/mark-paid`,
      {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({ txHash: "f".repeat(64) }),
      },
    );
    expect(paid.status).toBe(200);
    const paidBody = (await paid.json()) as {
      withdrawal: { status: string; txHash: string | null };
    };
    expect(paidBody.withdrawal.status).toBe("paid");
    expect(paidBody.withdrawal.txHash).toBe("f".repeat(64));

    // Audit for the withdrawal lifecycle.
    const actions = h.audit._rows.map((a) => a.action);
    for (const expected of [
      "withdraw.request",
      "admin.withdraw.approve",
      "admin.withdraw.paid",
      "lock.create",
    ]) {
      expect(actions).toContain(expected);
    }
  });

  it("queued sell does NOT match before the primary sells out", async () => {
    const h = makeHarness({ extraProperties: [SMALL] });
    await buyPrimary(h, "user-a", SMALL.id, 5);
    await placeOrder(h, "user-a", {
      propertyId: SMALL.id,
      side: "sell",
      priceUsd: 9_000,
      quantity: 3,
    });
    // A crossing buy while still funding → rejected (primary buys go through /v1/buys).
    await h.balances.adjust("user-b", { investingDelta: 100_000 });
    const bid = await placeOrder(h, "user-b", {
      propertyId: SMALL.id,
      side: "buy",
      priceUsd: 9_500,
      quantity: 3,
    });
    expect(bid.status).toBe(409);
    await expect(bid.json()).resolves.toMatchObject({ code: "invalid_phase" });
    expect(h.trades._rows).toHaveLength(0);
  });
});
