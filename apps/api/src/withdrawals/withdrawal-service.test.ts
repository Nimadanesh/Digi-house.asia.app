import { describe, expect, it } from "vitest";
import { createMemoryUserStore } from "../auth/user-store.js";
import { createMemoryTxStore } from "../buys/tx-store.js";
import { createMemoryBalanceStore } from "../money/balance-store.js";
import { createMemoryInstallmentStore } from "./installment-store.js";
import { createMemoryWithdrawalStore } from "./withdrawal-store.js";
import {
  approveWithdrawal,
  payInstallment,
  payNextInstallment,
  rejectWithdrawal,
  requestWithdrawal,
} from "./withdrawal-service.js";
import { WITHDRAWAL_INSTALLMENT_COUNT } from "./withdrawal-constants.js";

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
  const installments = createMemoryInstallmentStore();
  return { users, balances, transactions, withdrawals, installments };
}

async function fund(deps: ReturnType<typeof makeDeps>, amountUsd: number) {
  await deps.balances.adjust(USER, { withdrawableDelta: amountUsd });
}

describe("requestWithdrawal (PE-02, locked model)", () => {
  it("debits withdrawable atomically, charges the 1% fee, records 4 installments summing to net", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);

    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    // 1% of 12_500 = 125; net = 12_375; 4 installments: 3094+3094+3094+3093 = 12_375
    expect(r.feeUsd).toBe(125);
    expect(r.netUsd).toBe(12_375);
    expect(r.installments).toHaveLength(WITHDRAWAL_INSTALLMENT_COUNT);
    const sum = r.installments.reduce((acc, i) => acc + i.amountUsd, 0);
    expect(sum).toBe(r.netUsd);
    expect(
      r.installments.map((i) => i.amountUsd).sort((a, b) => b - a)[0]! -
        r.installments.map((i) => i.amountUsd).sort((a, b) => b - a)[3]!,
    ).toBeLessThanOrEqual(1);

    expect(r.withdrawal.userId).toBe(USER);
    expect(r.withdrawal.amountUsd).toBe(12_500);
    expect(r.withdrawal.feeUsd).toBe(125);
    expect(r.withdrawal.address).toBe(ADDRESS);
    expect(r.withdrawal.status).toBe("requested");
    expect(r.withdrawal.transactionId).toBe(r.txId);

    // Atomic debit happened (gross).
    expect((await deps.balances.get(USER))?.withdrawableUsd).toBe(37_500);

    const txs = await deps.transactions.listByUserId(USER);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toMatchObject({
      kind: "withdraw",
      amountUsd: 12_500,
      feeUsd: 125,
      currency: "USDT",
      status: "pending",
    });

    // Installments persisted with weekly due dates.
    const stored = await deps.installments.listByWithdrawal(r.withdrawal.id);
    expect(stored).toHaveLength(4);
    for (let i = 1; i < stored.length; i++) {
      const diffMs =
        stored[i]!.dueAt.getTime() - stored[i - 1]!.dueAt.getTime();
      expect(diffMs).toBe(7 * 86_400_000);
    }
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

  it("rejected withdrawals can never be paid (installments locked)", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const req = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    if (!req.ok) throw new Error("expected success");
    await rejectWithdrawal(deps, { withdrawalId: req.withdrawal.id });

    const paid = await payNextInstallment(deps, {
      withdrawalId: req.withdrawal.id,
      txHash: "h".repeat(64),
    });
    expect(paid.ok).toBe(false);
    if (!paid.ok) expect(paid.code).toBe("terminal");
  });
});

describe("approveWithdrawal / installment payments (PE-03)", () => {
  async function requested(deps: ReturnType<typeof makeDeps>) {
    const r = await requestWithdrawal(deps, { userId: USER, amountUsd: 12_500 });
    if (!r.ok) throw new Error("expected success");
    return r;
  }

  it("approve moves requested → approved (ledger stays pending)", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const { withdrawal } = await requested(deps);

    const approved = await approveWithdrawal(deps, {
      withdrawalId: withdrawal.id,
    });
    expect(approved?.status).toBe("approved");
    expect((await deps.transactions.listByUserId(USER))[0]?.status).toBe(
      "pending",
    );
  });

  it("paying all 4 installments flips the withdrawal to paid and the ledger to success", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const { withdrawal } = await requested(deps);
    await approveWithdrawal(deps, { withdrawalId: withdrawal.id });

    // After 3 of 4, still approved (not terminal).
    for (let seq = 1; seq <= 3; seq++) {
      const paid = await payInstallment(deps, {
        withdrawalId: withdrawal.id,
        seq,
        txHash: `tx-${seq}-` + "a".repeat(60),
      });
      expect(paid.ok).toBe(true);
      const current = await deps.withdrawals.get(withdrawal.id);
      expect(current?.status).toBe("approved");
    }

    // 4th payment completes the withdrawal.
    const last = await payInstallment(deps, {
      withdrawalId: withdrawal.id,
      seq: 4,
      txHash: "b".repeat(64),
    });
    expect(last.ok).toBe(true);
    if (!last.ok) return;
    expect(last.withdrawal.status).toBe("paid");
    expect(last.withdrawal.txHash).toBe("b".repeat(64));

    const tx = (await deps.transactions.listByUserId(USER))[0]!;
    expect(tx.status).toBe("success");
    expect(tx.txHash).toBe("b".repeat(64));

    // All installments paid.
    const stored = await deps.installments.listByWithdrawal(withdrawal.id);
    expect(stored.every((i) => i.status === "paid")).toBe(true);
  });

  it("a second payment of the same installment is rejected (no double-pay)", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const { withdrawal } = await requested(deps);

    const first = await payInstallment(deps, {
      withdrawalId: withdrawal.id,
      seq: 1,
      txHash: "x".repeat(64),
    });
    expect(first.ok).toBe(true);

    const again = await payInstallment(deps, {
      withdrawalId: withdrawal.id,
      seq: 1,
      txHash: "y".repeat(64),
    });
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.code).toBe("already_paid");
  });

  it("payNextInstallment pays installments in seq order and never pays a paid one", async () => {
    const deps = makeDeps();
    await fund(deps, 50_000);
    const { withdrawal } = await requested(deps);

    const p1 = await payNextInstallment(deps, {
      withdrawalId: withdrawal.id,
      txHash: "p1-" + "c".repeat(61),
    });
    expect(p1.ok).toBe(true);
    if (!p1.ok) return;
    expect(p1.installment.seq).toBe(1);

    const p2 = await payNextInstallment(deps, {
      withdrawalId: withdrawal.id,
      txHash: "p2-" + "c".repeat(61),
    });
    expect(p2.ok).toBe(true);
    if (!p2.ok) return;
    expect(p2.installment.seq).toBe(2);
  });

  it("approve/pay return null for unknown withdrawals", async () => {
    const deps = makeDeps();
    expect(
      await approveWithdrawal(deps, { withdrawalId: "wd_missing" }),
    ).toBeNull();
    const paid = await payNextInstallment(deps, {
      withdrawalId: "wd_missing",
      txHash: "h".repeat(64),
    });
    expect(paid.ok).toBe(false);
    if (!paid.ok) expect(paid.code).toBe("withdrawal_not_found");
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
