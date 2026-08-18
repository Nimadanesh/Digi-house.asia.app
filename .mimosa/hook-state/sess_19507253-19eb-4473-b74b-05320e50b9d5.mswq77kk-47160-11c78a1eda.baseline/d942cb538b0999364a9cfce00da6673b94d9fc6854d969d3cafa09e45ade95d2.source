import { describe, expect, it } from "vitest";
import { createFeeRoutes } from "./fees.js";
import { createMemoryFeeTierStore } from "../fees/fee-tier-store.js";

function setup() {
  const tiers = createMemoryFeeTierStore();
  const app = createFeeRoutes({ tiers });
  return { app, tiers };
}

describe("GET /v1/fees", () => {
  it("returns the seeded schedule ordered by min amount", async () => {
    const { app } = setup();
    const res = await app.request("/v1/fees");
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      tiers: Array<{
        minAmountUsd: number;
        maxAmountUsd: number | null;
        buyPrimaryBps: number;
      }>;
    };
    expect(body.tiers).toHaveLength(9);
    expect(body.tiers[0]).toMatchObject({
      minAmountUsd: 8_000,
      maxAmountUsd: 50_000,
      buyPrimaryBps: 300,
    });
    expect(body.tiers[8]!.maxAmountUsd).toBeNull();
  });
});

describe("GET /v1/fees/preview", () => {
  it("quotes a tiered buy", async () => {
    const { app } = setup();
    const res = await app.request(
      "/v1/fees/preview?amountUsd=10000&op=buy_primary",
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      op: "buy_primary",
      amountUsd: 10_000,
      tierId: 1,
      bps: 300,
      feeUsd: 300,
      netUsd: 9_700,
      totalUsd: 10_300,
    });
  });

  it("quotes flat-rate instant sell even below the tier floor", async () => {
    const { app } = setup();
    const res = await app.request(
      "/v1/fees/preview?amountUsd=2000&op=sell_instant",
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      tierId: null,
      bps: 700,
      feeUsd: 140,
      netUsd: 1_860,
    });
  });

  it("404s when no tier covers the amount", async () => {
    const { app } = setup();
    const res = await app.request(
      "/v1/fees/preview?amountUsd=100&op=buy_primary",
    );
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      code: "no_fee_tier",
    });
  });

  it("400s on invalid amount or op", async () => {
    const { app } = setup();
    const badAmount = await app.request(
      "/v1/fees/preview?amountUsd=10.5&op=buy_primary",
    );
    expect(badAmount.status).toBe(400);
    const badOp = await app.request(
      "/v1/fees/preview?amountUsd=10000&op=transfer",
    );
    expect(badOp.status).toBe(400);
    const missing = await app.request("/v1/fees/preview?op=buy_primary");
    expect(missing.status).toBe(400);
  });
});

describe("GET /v1/fees/preview — schedule sanity", () => {
  it("agrees with resolveFee across tier boundaries", async () => {
    const { app } = setup();
    for (const [amountUsd, op, tierId] of [
      [8_000, "buy_primary", 1],
      [50_001, "buy_primary", 2],
      [1_000_000_000, "buy_secondary", 9],
    ] as const) {
      const res = await app.request(
        `/v1/fees/preview?amountUsd=${amountUsd}&op=${op}`,
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { tierId: number | null };
      expect(body.tierId).toBe(tierId);
    }
  });
});
