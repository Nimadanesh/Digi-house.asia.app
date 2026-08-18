import { describe, it, expect } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { seed } from "../seed";

describe("mock seed", () => {
  it("has at least 6 properties across funding/funded/resale", () => {
    expect(seed.properties.length).toBeGreaterThanOrEqual(6);
    const statuses = new Set(seed.properties.map((p) => p.status));
    expect(statuses.has("funding")).toBe(true);
    expect(statuses.has("funded")).toBe(true);
    expect(statuses.has("resale")).toBe(true);
  });

  it("has no duplicate property ids and all annual rents are non-zero", () => {
    const ids = new Set(seed.properties.map((p) => p.id));
    expect(ids.size).toBe(seed.properties.length);
    for (const p of seed.properties) {
      expect(p.annualRentUsd).toBeGreaterThan(0);
    }
  });

  it("ships non-empty local property cover images", () => {
    const root = join(process.cwd(), "public");
    const covers = seed.properties.flatMap((p) => p.images);
    expect(covers.length).toBeGreaterThanOrEqual(6);
    for (const src of covers) {
      const file = join(root, src.replace(/^\//, ""));
      expect(existsSync(file)).toBe(true);
      expect(statSync(file).size).toBeGreaterThan(500);
    }
  });

  it("has holdings and at least one open order", () => {
    expect(seed.holdings.length).toBeGreaterThanOrEqual(2);
    expect(seed.openOrders.length).toBeGreaterThanOrEqual(1);
  });

  it("has at least 4 earnings entries spanning >=4 distinct weeks", () => {
    expect(seed.earnings.length).toBeGreaterThanOrEqual(4);
    const weeks = new Set(seed.earnings.map((e) => e.weekOf));
    expect(weeks.size).toBeGreaterThanOrEqual(4);
  });

  it("marks every paid entry with a synthetic simulated:<uuid> txHash", () => {
    const paid = seed.earnings.filter((e) => e.status === "paid");
    expect(paid.length).toBeGreaterThanOrEqual(1);
    for (const e of paid) {
      expect(e.txHash).toMatch(/^simulated:/);
    }
  });

  it("keeps at least one pending entry without a txHash", () => {
    const pending = seed.earnings.filter((e) => e.status === "pending");
    expect(pending.length).toBeGreaterThanOrEqual(1);
    for (const e of pending) {
      expect(e.txHash).toBeUndefined();
    }
  });

  it("includes a success tx with a synthetic hash plus a failed and a pending tx", () => {
    const statuses = seed.transactions.map((t) => t.status);
    expect(statuses).toContain("success");
    expect(statuses).toContain("pending");
    expect(statuses).toContain("failed");
    const success = seed.transactions.filter((t) => t.status === "success");
    expect(success.length).toBeGreaterThanOrEqual(1);
    for (const t of success) {
      expect(t.txHash).toMatch(/^simulated:/);
    }
    const failed = seed.transactions.find((t) => t.status === "failed");
    expect(failed?.txHash).toBeUndefined();
    expect(failed?.error).toBeTruthy();
  });
});
