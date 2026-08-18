import { describe, expect, it } from "vitest";
import {
  createMemoryBalanceStore,
  InsufficientBalanceError,
} from "./balance-store.js";

describe("memory balance store", () => {
  it("adjust creates a zero row on first credit", async () => {
    const store = createMemoryBalanceStore();
    const row = await store.adjust("u1", { withdrawableDelta: 1_250 });
    expect(row).toMatchObject({
      userId: "u1",
      investingUsd: 0,
      withdrawableUsd: 1_250,
    });
  });

  it("credits and debits both balances independently", async () => {
    const store = createMemoryBalanceStore();
    await store.adjust("u1", { investingDelta: 10_000, withdrawableDelta: 500 });
    const row = await store.adjust("u1", { investingDelta: -4_000 });
    expect(row).toMatchObject({ investingUsd: 6_000, withdrawableUsd: 500 });
  });

  it("throws InsufficientBalanceError on overdraft", async () => {
    const store = createMemoryBalanceStore();
    await store.adjust("u1", { investingDelta: 100 });
    await expect(
      store.adjust("u1", { investingDelta: -101 }),
    ).rejects.toBeInstanceOf(InsufficientBalanceError);
    await expect(
      store.adjust("u1", { withdrawableDelta: -1 }),
    ).rejects.toBeInstanceOf(InsufficientBalanceError);
    // failed debit must not mutate anything
    expect(await store.get("u1")).toMatchObject({
      investingUsd: 100,
      withdrawableUsd: 0,
    });
  });

  it("rejects non-integer or zero deltas", async () => {
    const store = createMemoryBalanceStore();
    await expect(
      store.adjust("u1", { investingDelta: 1.5 }),
    ).rejects.toThrow(/integer/);
    await expect(
      store.adjust("u1", { investingDelta: 0 }),
    ).rejects.toThrow(/integer/);
  });
});
