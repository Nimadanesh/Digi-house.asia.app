import { describe, expect, it } from "vitest";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryWithdrawalStore } from "./withdrawal-store.js";
import {
  approveWithdrawal,
  payWithdrawal,
  rejectWithdrawal,
  requestWithdrawal,
} from "./withdrawal-service.js";

const ADDRESS = "EQHq2VsN7yKwTp8rUy4mL0kHbZ6sAeF4oVgB8uTr9pXkMdH5";
const USER = "user-a";

function makeDeps(over: { address?: string | null } = {}) {
  const users = createMemoryUserStore([
    {
      id: USER,
      displayName: "A",
      withdrawalAddress:
        over.address === undefined ? ADDRESS : over.address,
    },
  ]);
  const balances = createMemoryBalanceStore();
  const transactions = createMemoryTxStore();
  const withdrawals = createMemoryWithdrawalStore();
  return { users, balances, transactions, withdrawals };
}

async function fund(deps: ReturnType<typeof makeDeps>, amountUsd: number) {
  await deps.balances.adjust(USER, { withdrawableDelta: amountUsd });
}

describe("requestWithdrawal (PE-02)", () => {
  it("debits withdrawable atomically and records a requested withdrawal + pending ledger row", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);

    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.withdrawal.userId).toBe(USER);
    expect(r.withdrawal.amountUsd).toBe(12_500);
    expect(r.withdrawal.address).toBe(ADDRESS);
    expect(r.withdrawal.status).toBe("requested");
    expect(r.withdrawal.transactionId).toBe(r.txId);

    // Atomic debit happened.
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(37_500);

    const txs = await deps.transactions.listByUserId(USER);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({
      kind: "withdraw",
      amountUsd: 12_500,
      currency: "USDT",
      status: "pending",
    });
  });

  it("rejects with no_withdrawal_address when the user has not set one", async () => {
    const deps = makeDeps({ address: null });
    await fund(deps, 50_000);

    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 1_000 });
    expect(r).toEqual({ ok: false, code: "no_withdrawal_address" });
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(50_000);
    expect(await deps.withdrawals.listByUser(USER)).toHaveLength(0);
  });

  it("rejects with insufficient_balance without debiting or recording", async () => {
    const deps = makeDeps();
    await fund(deps, 1_000);

    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 50_000 });
    expect(r).toEqual({ ok: false, code: "insufficient_balance" });
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(1_000);
    expect(await deps.withdrawals.listByUser(USER)).toHaveLength(0);
    expect(await deps.transactions.listByUserId(USER)).toHaveLength(0);
  });
});

describe("rejectWithdrawal (refund on reject)", () => {
  it("refunds the debit once and moves the ledger row to failed", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const req = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    if (!req.ok) throw new Error("expected success");
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(37_500);

    const rejected = await rejectWithdrawal(deps, {
      withdrawalId: req.withdrawal.id,
    });
    expect(rejected?.status).toBe("rejected");
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(50_000);

    const txs = await deps.transactions.listByUserId(USER);
    expect(txs[0]?.status).toBe("failed");
    expect(txs[0]?.error).toBe("rejected");
  });

  it("is idempotent — a second reject does not double-credit", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const req = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    if (!req.ok) throw new Error("expected success");

    await rejectWithdrawal(deps, { withdrawalId: req.withdrawal.id });
    const again = await rejectWithdrawal(deps, {
      withdrawalId: req.withdrawal.id,
    });
    expect(again?.status).toBe("rejected");
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(50_000);
  });

  it("returns null for an unknown withdrawal", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    expect(
      await rejectWithdrawal(deps, { withdrawalId: "wd_missing" }),
    ).toBeNull();
  });
});

describe("approveWithdrawal / payWithdrawal (PE-03)", () => {
  async function requested(deps: ReturnType<typeof makeDeps>) {
    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    if (!r.ok) throw new Error("expected success");
    return r.withdrawal;
  }

  it("approve moves requested → approved (ledger stays pending)", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const w = await requested(deps);

    const approved = await approveWithdrawal(deps, {
      withdrawalId: w.id,
    });
    expect(approved?.status).toBe("approved");
    expect((await deps.transactions.listByUserId(USER))[0]?.status).toBe(
      "pending",
    );
  });

  it("pay moves approved → paid and flips the ledger row to success with the tx hash", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const w = await requested(deps);
    await approveWithdrawal(deps, { withdrawalId: w.id });

    const txHash = "h".repeat(64);
    const paid = await payWithdrawal(deps, { withdrawalId: w.id, txHash });
    expect(paid?.status).toBe("paid");
    expect(paid?.txHash).toBe(txHash);

    const tx = (await deps.transactions.listByUserId(USER))[0]!;
    expect(tx.status).toBe("success");
    expect(tx.txHash).toBe(txHash);
  });

  it("pay from requested directly also works (admin may skip approve)", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const w = await requested(deps);

    const paid = await payWithdrawal(deps, {
      withdrawalId: w.id,
      txHash: "g".repeat(64),
    });
    expect(paid?.status).toBe("paid");
  });

  it("approve/pay return null for unknown withdrawals", async () => {
    const deps = makeDeps();
    expect(
      await approveWithdrawal(deps, { withdrawalId: "wd_missing" }),
    ).toBeNull();
    expect(
      await payWithdrawal(deps, {
        withdrawalId: "wd_missing",
        txHash: "h".repeat(64),
      }),
    ).toBeNull();
  });
});

describe("reject race — single refund", () => {
  it("two concurrent rejects refund the withdrawable exactly once", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    if (!r.ok) throw new Error("expected success");
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(37_500);

    const [a, b] = await Promise.all([
      rejectWithdrawal(deps, { withdrawalId: r.withdrawal.id }),
      rejectWithdrawal(deps, { withdrawalId: r.withdrawal.id }),
    ]);

    // Both settle on the terminal record; the refund happened exactly once.
    expect(a?.status).toBe("rejected");
    expect(b?.status).toBe("rejected");
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(50_000);
    const txs = await deps.transactions.listByUserId(USER);
    expect(txs.filter((t) => t.status === "failed")).toHaveLength(1);
  });
});

describe("concurrency — no overdraft (PE-02)", () => {
  it("two simultaneous requests cannot overdraw the withdrawable balance", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000); // $500 withdrawable

    const [r1, r2] = await Promise.all([
      requestWithdrawal(deps, { userId: USER, amountUsd: 30_000 }),
      requestWithdrawal(deps, { userId: USER, amountUsd: 30_000 }),
    ]);

    // Exactly one wins; the other is rejected — the atomic debit never overdraws.
    expect([r1.ok, r2.ok].filter(Boolean)).toHaveLength(1);
    const failed = [r1, r2].find((r) => !r.ok);
    expect(failed?.ok).toBe(false);
    if (failed && !failed.ok) {
      expect(failed.code).toBe("insufficient_balance");
    }

    // Balance never went negative; only the winning request was recorded.
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(20_000);
    expect(await deps.withdrawals.listByUser(USER)).toHaveLength(1);
    expect(await deps.transactions.listByUserId(USER)).toHaveLength(1);
  });

  it("many simultaneous requests still never overdraw (stress)", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        requestWithdrawal(deps, { userId: USER, amountUsd: 20_000 }),
      ),
    );

    // $500 / $200 → exactly two debits fit; the rest must be rejected.
    const okCount = results.filter((r) => r.ok).length;
    expect(okCount).toBe(2);
    expect(
      results.filter((r) => !r.ok && r.code === "insufficient_balance").length,
    ).toBe(3);
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(10_000);
    expect(await deps.withdrawals.listByUser(USER)).toHaveLength(2);
    expect(await deps.transactions.listByUserId(USER)).toHaveLength(2);
  });
});
