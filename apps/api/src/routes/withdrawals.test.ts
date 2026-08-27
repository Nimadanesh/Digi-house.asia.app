import { describe, expect, it } from "vitest";
import { signSessionToken } from "../auth/session.js";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryInstallmentStore } from "../withdrawals/installment-store.js";
import { createMemoryWithdrawalStore } from "../withdrawals/withdrawal-store.js";
import { createWithdrawalRoutes } from "./withdrawals.js";

const SESSION = { secret: "test-session-secret-at-least-32-chars", ttlSeconds: 3600 };
const USER = "user-a";
const OTHER = "user-b";
const ADDRESS = "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5";

async function bearerFor(userId: string): Promise<string> {
  const { token } = await signSessionToken(userId, SESSION);
  return `Bearer ${token}`;
}

function makeApp() {
  const users = createMemoryUserStore([
    { id: USER, displayName: "A", withdrawalAddress: ADDRESS },
    { id: OTHER, displayName: "B" },
  ]);
  const balances = createMemoryBalanceStore();
  const transactions = createMemoryTxStore();
  const withdrawals = createMemoryWithdrawalStore();
  const installments = createMemoryInstallmentStore();
  const app = createWithdrawalRoutes({
    session: SESSION,
    users,
    balances,
    transactions,
    withdrawals,
    installments,
  });
  return { app, users, balances, transactions, withdrawals, installments };
}

function post(
  app: ReturnType<typeof makeApp>["app"],
  token: string,
  body: unknown,
) {
  return app.request("/v1/withdrawals", {
    method: "POST",
    headers: { Authorization: token, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /v1/withdrawals (PE-02)", () => {
  it("201 — debits withdrawable, returns gross + 1% fee + 4 installments summing to net", async () => {
    const { app, balances } = makeApp();
    await balances.adjust(USER, { withdrawableDelta: 50_000 });
    const token = await bearerFor(USER);

    const res = await post(app, token, { amountUsd: 12_500 });
    expect(res.status).toBe(201);
    const body = (await res.json()) as {
      withdrawal: {
        amountUsd: number;
        feeUsd: number;
        netUsd: number;
        address: string;
        status: string;
        txHash: string | null;
        installments: Array<{ seq: number; amountUsd: number; status: string }>;
      };
    };
    expect(body.withdrawal.amountUsd).toBe(12_500);
    expect(body.withdrawal.feeUsd).toBe(125);
    expect(body.withdrawal.netUsd).toBe(12_375);
    expect(body.withdrawal.address).toBe(ADDRESS);
    expect(body.withdrawal.status).toBe("requested");
    expect(body.withdrawal.txHash).toBeNull();
    expect(body.withdrawal.installments).toHaveLength(4);
    const sum = body.withdrawal.installments.reduce(
      (acc, i) => acc + i.amountUsd,
      0,
    );
    expect(sum).toBe(body.withdrawal.netUsd);
    expect(
      body.withdrawal.installments.every((i) => i.status === "pending"),
    ).toBe(true);
    expect((await balances.get(USER))?.withdrawableUsd).toBe(37_500);
  });

  it("409 — insufficient withdrawable balance, nothing recorded", async () => {
    const { app, balances, withdrawals } = makeApp();
    await balances.adjust(USER, { withdrawableDelta: 1_000 });
    const token = await bearerFor(USER);

    const res = await post(app, token, { amountUsd: 50_000 });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("insufficient_balance");
    expect(await withdrawals.listByUser(USER)).toHaveLength(0);
    expect((await balances.get(USER))?.withdrawableUsd).toBe(1_000);
  });

  it("400 — no withdrawal address set", async () => {
    const { app } = makeApp();
    const token = await bearerFor(OTHER);
    const res = await post(app, token, { amountUsd: 1_000 });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe("no_withdrawal_address");
  });

  it("400 — invalid amount", async () => {
    const { app } = makeApp();
    const token = await bearerFor(USER);
    for (const amountUsd of [0, -5, 1.5, "100", null]) {
      const res = await post(app, token, { amountUsd });
      expect(res.status, `amountUsd=${String(amountUsd)}`).toBe(400);
    }
  });

  it("401 — without auth", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountUsd: 1_000 }),
    });
    expect(res.status).toBe(401);
  });
});

describe("GET /v1/withdrawals (PE-02)", () => {
  it("returns only the caller's withdrawals, newest first, with installment progress", async () => {
    const { app, balances } = makeApp();
    await balances.adjust(USER, { withdrawableDelta: 100_000 });
    const token = await bearerFor(USER);

    await post(app, token, { amountUsd: 10_000 });
    await new Promise((r) => setTimeout(r, 5)); // ensure distinct createdAt
    await post(app, token, { amountUsd: 20_000 });

    const res = await app.request("/v1/withdrawals", {
      headers: { Authorization: token },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      withdrawals: Array<{
        amountUsd: number;
        installments: unknown[];
      }>;
    };
    expect(body.withdrawals).toHaveLength(2);
    expect(body.withdrawals[0]?.amountUsd).toBe(20_000);
    expect(body.withdrawals[1]?.amountUsd).toBe(10_000);
    expect(body.withdrawals[0]?.installments).toHaveLength(4);
    expect(body.withdrawals[1]?.installments).toHaveLength(4);
  });

  it("is scoped per user (no IDOR)", async () => {
    const { app, balances } = makeApp();
    await balances.adjust(USER, { withdrawableDelta: 50_000 });
    await post(app, await bearerFor(USER), { amountUsd: 10_000 });

    const otherRes = await app.request("/v1/withdrawals", {
      headers: { Authorization: await bearerFor(OTHER) },
    });
    const otherBody = (await otherRes.json()) as { withdrawals: unknown[] };
    expect(otherBody.withdrawals).toEqual([]);
  });

  it("401 — without auth", async () => {
    const { app } = makeApp();
    const res = await app.request("/v1/withdrawals");
    expect(res.status).toBe(401);
  });
});
